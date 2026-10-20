# Ladrillos

Juego de romper ladrillos en blanco y negro, estilo PC antiguo. Se publica en https://ladrillos.jayues.com con Cloudflare Pages.

- `index.html`: el juego completo (sin dependencias externas).
- `fuentes/`: fuente Press Start 2P servida desde aquí (licencia SIL OFL en `fuentes/OFL.txt`).
- `functions/api/records.js`: ranking compartido (`GET` top 10, `POST` guarda partida) sobre Cloudflare D1.
- `functions/_filtro.js`: palabras no permitidas en el nombre (la misma lista está en `index.html`).

## Base de datos

Base D1 enlazada al proyecto de Pages con el nombre de variable `DB`. Las tablas se crean solas en la primera petición.

Borrar un récord (consola de D1 en Cloudflare):

```sql
SELECT id, nombre, score, fecha FROM records ORDER BY score DESC LIMIT 20;
DELETE FROM records WHERE id = 'pega-aqui-el-id';
```
