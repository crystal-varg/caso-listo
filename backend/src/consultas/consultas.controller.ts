import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';
import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  Request,
  Res,
  BadRequestException,
  NotFoundException,
  ParseIntPipe,
  PayloadTooLargeException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { Response } from 'express';
import { ConsultasService } from './consultas.service';
import { CreateConsultaDto, UpdateConsultaDto } from './consulta.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EstadoConsulta, FueroConsulta } from './consulta.entity';
import { matchesSlugFormat, isValidSlugFormat } from '../common/utils/slug';
import { detectAllowedFileType, ALLOWED_MIME_TYPES } from '../common/utils/file-magic';

interface MulFile {
  fieldname: string;
  originalname: string;
  filename: string;
  path: string;
  size: number;
  mimetype: string;
}

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB per file
const MAX_TOTAL_SIZE = 10 * 1024 * 1024; // 10 MB total per request
const MAX_FILES = 2;

/**
 * Multer disk storage.
 *
 * Files are written under a UUID filename with a neutral `.bin` extension. Only
 * after magic-byte validation do we rename to `<uuid>.<validated-ext>`. A
 * user-supplied filename is never persisted — this blocks path traversal,
 * overwrite attacks, and extension spoofing in one stroke.
 *
 * TODO(virus-scan): add AV scanning between steps 2 and 4 below.
 *   1. Upload  -> UPLOAD_DIR/<uuid>.bin
 *   2. Validate magic bytes
 *   3. [STUB] AV scan (ClamAV / S3-lambda)
 *   4. Rename -> <uuid>.<validated-ext>
 *   5. Persist validated filename on consulta record
 */
const multerOpts = {
  storage: diskStorage({
    destination: (_req, _file, cb) => {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
      cb(null, UPLOAD_DIR);
    },
    filename: (_req, _file, cb) => {
      cb(null, `${randomUUID()}.bin`);
    },
  }),
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: MAX_FILES,
    fields: 20,
    fieldSize: 16 * 1024,
  },
  fileFilter: (_req: any, file: MulFile, cb: any) => {
    // Cheap first-line defence — reject obviously wrong Content-Type headers.
    // The real check is magic-byte validation after upload.
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype as any)) {
      return cb(new BadRequestException('Tipo de archivo no permitido.'), false);
    }
    cb(null, true);
  },
};

function validateAndFinalize(file: MulFile): string {
  let fd: number | null = null;
  try {
    fd = fs.openSync(file.path, 'r');
    const buf = Buffer.alloc(16);
    fs.readSync(fd, buf, 0, 16, 0);
    const detected = detectAllowedFileType(buf);
    if (!detected) {
      throw new BadRequestException('El archivo no coincide con un PDF/JPG/PNG válido.');
    }
    const finalName = `${path.basename(file.filename, '.bin')}.${detected.ext}`;
    const finalPath = path.join(UPLOAD_DIR, finalName);
    fs.renameSync(file.path, finalPath);
    return finalName;
  } catch (err) {
    try { if (fd !== null) fs.closeSync(fd); } catch {}
    fd = null;
    try { fs.unlinkSync(file.path); } catch {}
    throw err;
  } finally {
    if (fd !== null) {
      try { fs.closeSync(fd); } catch {}
    }
  }
}

@Controller('consultas')
export class ConsultasController {
  constructor(private readonly consultasService: ConsultasService) {}

  @Post('publica/:slug')
  @Throttle({ default: { limit: 20, ttl: 60 * 60 * 1000 } })
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'dni_archivo', maxCount: 1 },
        { name: 'docs_archivo', maxCount: 1 },
      ],
      multerOpts,
    ),
  )
  async createPublica(
    @Param('slug') slug: string,
    @Body() dto: CreateConsultaDto,
    @UploadedFiles()
    files?: { dni_archivo?: MulFile[]; docs_archivo?: MulFile[] },
  ) {
    if (!matchesSlugFormat(slug)) {
      this.cleanupUploads(files);
      throw new BadRequestException('Slug inválido.');
    }
    if (!isValidSlugFormat(slug)) {
      this.cleanupUploads(files);
      throw new NotFoundException('No encontrado.');
    }

    const total = this.totalSize(files);
    if (total > MAX_TOTAL_SIZE) {
      this.cleanupUploads(files);
      throw new PayloadTooLargeException(
        `Tamaño total excedido (máximo ${MAX_TOTAL_SIZE} bytes).`,
      );
    }

    let dniArchivo: string | null = null;
    let docsArchivo: string | null = null;
    try {
      if (files?.dni_archivo?.[0]) {
        dniArchivo = validateAndFinalize(files.dni_archivo[0]);
      } else if (dto.dni_estado === 'faltante') {
        dniArchivo = 'faltante';
      }
      if (files?.docs_archivo?.[0]) {
        docsArchivo = validateAndFinalize(files.docs_archivo[0]);
      } else if (dto.docs_estado === 'faltante') {
        docsArchivo = 'faltante';
      }
    } catch (err) {
      this.cleanupUploads(files);
      throw err;
    }

    return this.consultasService.createPublica(slug, dto, { dniArchivo, docsArchivo });
  }

  private totalSize(
    files?: { dni_archivo?: MulFile[]; docs_archivo?: MulFile[] },
  ): number {
    return (
      (files?.dni_archivo?.[0]?.size ?? 0) +
      (files?.docs_archivo?.[0]?.size ?? 0)
    );
  }

  private cleanupUploads(
    files?: { dni_archivo?: MulFile[]; docs_archivo?: MulFile[] },
  ): void {
    for (const key of ['dni_archivo', 'docs_archivo'] as const) {
      const f = files?.[key]?.[0];
      if (f?.path) {
        try { fs.unlinkSync(f.path); } catch {}
      }
    }
  }

  @Get('publica/:slug/disponibilidad')
  getDisponibilidad(
    @Param('slug') slug: string,
    @Query('fecha') fecha: string,
  ) {
    if (!matchesSlugFormat(slug)) {
      throw new BadRequestException('Slug inválido.');
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha ?? '')) {
      throw new BadRequestException('Fecha inválida.');
    }
    return this.consultasService.getDisponibilidad(slug, fecha);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(
    @Request() req,
    @Query('estado') estado?: EstadoConsulta,
    @Query('fuero') fuero?: string,
  ) {
    if (estado && !Object.values(EstadoConsulta).includes(estado)) {
      throw new BadRequestException('Estado inválido.');
    }
    if (fuero && !Object.values(FueroConsulta).includes(fuero as FueroConsulta)) {
      throw new BadRequestException('Fuero inválido.');
    }
    return this.consultasService.findByUsuario(req.user.id, { estado, fuero });
  }

  @UseGuards(JwtAuthGuard)
  @Get('stats')
  getStats(@Request() req) {
    return this.consultasService.getStats(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('sin-movimiento')
  getSinMovimiento(@Request() req) {
    return this.consultasService.findSinMovimiento(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('archivos/:filename')
  async getArchivo(
    @Request() req,
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    const safeName = path.basename(filename);
    if (safeName !== filename) {
      throw new BadRequestException('Nombre de archivo inválido.');
    }
    if (!/^[a-f0-9-]{10,60}\.(pdf|jpg|jpeg|png)$/i.test(safeName)) {
      throw new BadRequestException('Nombre de archivo inválido.');
    }

    const ok = await this.consultasService.userOwnsFile(req.user.id, safeName);
    if (!ok) throw new NotFoundException('Archivo no encontrado.');

    const filePath = path.join(UPLOAD_DIR, safeName);
    if (!fs.existsSync(filePath)) throw new NotFoundException('Archivo no encontrado.');
    res.sendFile(filePath);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(
    @Request() req,
    @Param('id', new ParseIntPipe({ errorHttpStatusCode: 400 })) id: number,
  ) {
    return this.consultasService.findOne(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Request() req,
    @Param('id', new ParseIntPipe({ errorHttpStatusCode: 400 })) id: number,
    @Body() dto: UpdateConsultaDto,
  ) {
    return this.consultasService.update(id, req.user.id, dto);
  }
}
