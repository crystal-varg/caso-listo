import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { parse } from 'csv-parse/sync';
import { UsersService } from '../users/users.service';
import { EstudiosService } from '../estudios/estudios.service';
import { EstudioConfig } from '../estudios/estudio.entity';
import { sanitizeText } from '../common/utils/sanitize';

export interface CrearEstudioInput {
  nombre: string;
  email: string;
  password: string;
  slug: string;
  config: EstudioConfig;
}

export interface CrearEstudioCsvRow {
  slug?: string;
  nombre_completo?: string;
  email?: string;
  password?: string;
  whatsapp?: string;
  direccion?: string;
  color_primary?: string;
  color_secondary?: string;
  areas?: string;
  descripcion?: string;
}

export interface CsvImportResult {
  creados: number;
  errores: Array<{ fila: number; motivo: string }>;
}

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly estudiosService: EstudiosService,
  ) {}

  async listEstudios() {
    const estudios = await this.estudiosService.findAllForAdmin();
    return estudios.map((e) => ({
      id: e.id,
      slug: e.slug,
      nombre_estudio: e.nombre_estudio,
      config: e.config,
      usuario: e.usuario
        ? { nombre: e.usuario.nombre, email: e.usuario.email }
        : null,
      createdAt: e.created_at,
    }));
  }

  async crearEstudio(input: CrearEstudioInput) {
    const usuario = await this.usersService.createWithRole({
      nombre: input.nombre,
      email: input.email,
      password: input.password,
      role: 'estudio',
    });

    try {
      const estudio = await this.estudiosService.createWithSlug(
        usuario.id,
        input.config.nombre_completo ?? input.nombre,
        input.slug,
        input.config,
      );
      return {
        id: estudio.id,
        slug: estudio.slug,
        nombre_estudio: estudio.nombre_estudio,
        usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email },
      };
    } catch (err) {
      // Best-effort cleanup: drop the freshly-created user if the estudio insert
      // fails (e.g. duplicate slug), so a retry isn't blocked by an orphaned email.
      await this.usersService.deleteById(usuario.id).catch((cleanupErr) => {
        this.logger.error(
          `orphan user cleanup failed for ${usuario.id}: ${cleanupErr?.message}`,
        );
      });
      throw err;
    }
  }

  async actualizarConfig(slug: string, partial: Partial<EstudioConfig>) {
    const estudio = await this.estudiosService.updateConfigBySlug(slug, partial);
    return { slug: estudio.slug, config: estudio.config };
  }

  async eliminarEstudio(slug: string, confirmar: boolean) {
    if (confirmar !== true) {
      throw new BadRequestException(
        'Debes confirmar el borrado enviando { confirmar: true }.',
      );
    }
    const { usuarioId } = await this.estudiosService.deleteBySlug(slug);
    await this.usersService.deleteById(usuarioId);
    return { ok: true };
  }

  /**
   * Idempotently bootstrap the first admin account. Hard-fails if any admin
   * already exists — this is a one-shot system bootstrap, not a self-service
   * route.
   */
  async crearAdminBootstrap(input: {
    nombre: string;
    email: string;
    password: string;
  }) {
    const existing = await this.usersService.countByRole('admin');
    if (existing > 0) {
      throw new ForbiddenException('Ya existe un administrador.');
    }
    const usuario = await this.usersService.createWithRole({
      nombre: input.nombre,
      email: input.email,
      password: input.password,
      role: 'admin',
    });
    return { id: usuario.id, nombre: usuario.nombre, email: usuario.email };
  }

  async importarCsv(buffer: Buffer): Promise<CsvImportResult> {
    let rows: CrearEstudioCsvRow[];
    try {
      rows = parse(buffer, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      }) as CrearEstudioCsvRow[];
    } catch (err: any) {
      throw new BadRequestException(`CSV inválido: ${err?.message ?? 'parse error'}`);
    }

    const result: CsvImportResult = { creados: 0, errores: [] };

    for (let i = 0; i < rows.length; i++) {
      // Header row is row 1 in spreadsheet terms; first data row is 2.
      const fila = i + 2;
      const row = rows[i];
      try {
        const config = this.csvRowToConfig(row);
        await this.crearEstudio({
          nombre: sanitizeText(row.nombre_completo ?? ''),
          email: (row.email ?? '').trim(),
          password: row.password ?? '',
          slug: (row.slug ?? '').trim(),
          config,
        });
        result.creados += 1;
      } catch (err: any) {
        result.errores.push({
          fila,
          motivo: err?.message ?? 'Error desconocido',
        });
      }
    }

    return result;
  }

  private csvRowToConfig(row: CrearEstudioCsvRow): EstudioConfig {
    const requiredFields: Array<keyof CrearEstudioCsvRow> = [
      'slug',
      'nombre_completo',
      'email',
      'password',
      'color_primary',
      'color_secondary',
    ];
    for (const f of requiredFields) {
      if (!row[f] || String(row[f]).trim() === '') {
        throw new BadRequestException(`Falta el campo obligatorio "${f}".`);
      }
    }

    const areas = (row.areas ?? '')
      .split('|')
      .map((a) => a.trim())
      .filter((a) => a.length > 0);

    const nombre_completo = sanitizeText(row.nombre_completo!);
    const descripcion = sanitizeText(row.descripcion ?? '');

    return {
      nombre_completo,
      descripcion,
      color_primary: row.color_primary!,
      color_secondary: row.color_secondary!,
      whatsapp: row.whatsapp?.trim() || undefined,
      direccion: row.direccion?.trim() ? sanitizeText(row.direccion) : undefined,
      areas,
      servicios: [],
      seo: {
        titulo: nombre_completo,
        descripcion,
        keywords: areas,
      },
    };
  }
}
