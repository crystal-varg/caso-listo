import * as fs from 'fs';
import * as path from 'path';
import { randomBytes } from 'crypto';
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
  NotFoundException,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { Response } from 'express';
import { ConsultasService } from './consultas.service';
import { CreateConsultaDto, UpdateConsultaDto } from './consulta.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EstadoConsulta } from './consulta.entity';

interface MulFile {
  fieldname: string;
  originalname: string;
  filename: string;
  path: string;
  size: number;
  mimetype: string;
}

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

const multerOpts = {
  storage: diskStorage({
    destination: (_req, _file, cb) => {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
      cb(null, UPLOAD_DIR);
    },
    filename: (_req, file, cb) => {
      const unique = randomBytes(10).toString('hex');
      cb(null, `${unique}${path.extname(file.originalname).toLowerCase()}`);
    },
  }),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
  fileFilter: (_req: any, file: MulFile, cb: any) => {
    const allowed = /\.(pdf|jpg|jpeg|png|doc|docx)$/i;
    if (allowed.test(path.extname(file.originalname))) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido'), false);
    }
  },
};

@Controller('consultas')
export class ConsultasController {
  constructor(private readonly consultasService: ConsultasService) {}

  // ─── PÚBLICO: Cliente envía consulta ───────────────────────────────────────
  @Post('publica/:slug')
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
    const dniArchivo =
      files?.dni_archivo?.[0]?.filename ??
      (dto.dni_estado === 'faltante' ? 'faltante' : null);

    const docsArchivo =
      files?.docs_archivo?.[0]?.filename ??
      (dto.docs_estado === 'faltante' ? 'faltante' : null);

    const consulta = await this.consultasService.createPublica(slug, dto, {
      dniArchivo,
      docsArchivo,
    });
    return {
      ok: true,
      mensaje: 'Tu consulta fue enviada. Te contactaremos a la brevedad.',
      id: consulta.id,
    };
  }

  // ─── PÚBLICO: Disponibilidad de horarios ──────────────────────────────────
  @Get('publica/:slug/disponibilidad')
  getDisponibilidad(
    @Param('slug') slug: string,
    @Query('fecha') fecha: string,
  ) {
    return this.consultasService.getDisponibilidad(slug, fecha);
  }

  // ─── PRIVADO: Panel del abogado ────────────────────────────────────────────
  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(
    @Request() req,
    @Query('estado') estado?: EstadoConsulta,
    @Query('fuero') fuero?: string,
  ) {
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
  getArchivo(@Param('filename') filename: string, @Res() res: Response) {
    const safeName = path.basename(filename);
    const filePath = path.join(UPLOAD_DIR, safeName);
    if (!fs.existsSync(filePath)) throw new NotFoundException('Archivo no encontrado');
    res.sendFile(filePath);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    return this.consultasService.findOne(+id, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdateConsultaDto,
  ) {
    return this.consultasService.update(+id, req.user.id, dto);
  }
}
