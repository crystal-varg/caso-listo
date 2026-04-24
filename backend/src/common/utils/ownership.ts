import { NotFoundException } from '@nestjs/common';
import { SelectQueryBuilder } from 'typeorm';

/**
 * Single point for enforcing multi-tenant ownership. Returns the resource or
 * throws 404 — never 403. Leaking "resource exists but forbidden" is a known
 * enumeration oracle, so we return the same status for both "not found" and
 * "forbidden".
 *
 * Usage:
 *   const consulta = await assertOwnership(
 *     this.consultaRepo
 *       .createQueryBuilder('c')
 *       .innerJoin('c.estudio', 'e')
 *       .where('c.id = :id', { id })
 *       .andWhere('e.usuario_id = :uid', { uid: userId }),
 *     'Consulta no encontrada',
 *   );
 */
export async function assertOwnership<T>(
  qb: SelectQueryBuilder<T>,
  notFoundMessage = 'Recurso no encontrado',
): Promise<T> {
  const result = await qb.getOne();
  if (!result) {
    throw new NotFoundException(notFoundMessage);
  }
  return result;
}
