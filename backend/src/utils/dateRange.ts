const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Los filtros de fecha llegan como "YYYY-MM-DD" (día calendario del usuario)
 * o como ISO completo. Un día calendario se interpreta en la zona horaria del
 * servidor para que "hoy" incluya todo el día local.
 */
export function parseRangeStart(value: string): Date {
  const match = DATE_ONLY.exec(value);
  if (match) {
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  }
  return new Date(value);
}

export function parseRangeEnd(value: string): Date {
  const match = DATE_ONLY.exec(value);
  if (match) {
    return new Date(
      Number(match[1]),
      Number(match[2]) - 1,
      Number(match[3]),
      23,
      59,
      59,
      999
    );
  }
  const end = new Date(value);
  end.setHours(23, 59, 59, 999);
  return end;
}
