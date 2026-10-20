// Palabras no permitidas en el nombre. Misma lista que en index.html (PROHIBIDAS): si cambias una, cambia la otra.
const PROHIBIDAS = ['PUTA', 'PUTO', 'MIERDA', 'POLLA', 'JODER', 'JODID', 'CABRON', 'MARICON', 'GILIPOLL', 'SUBNORMAL', 'ZORRA',
  'NAZI', 'HITLER', 'FOLLA', 'RETRASAD', 'MAMON', 'PAJILLER', 'GUARRA', 'CHOCHO', 'VERGA', 'FUCK', 'SHIT', 'BITCH', 'CUNT', 'NIGG', 'NEGRAT', 'SUDACA'];

export function malsonante(nombre) {
  const t = String(nombre).toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/0/g, 'O').replace(/1/g, 'I').replace(/3/g, 'E').replace(/4/g, 'A').replace(/5/g, 'S').replace(/7/g, 'T').replace(/[^A-Z]/g, '');
  return PROHIBIDAS.some(p => t.includes(p));
}
