# Guía paso a paso: poner en marcha el backend con SQL Server

Esta guía reúne lo que hizo falta para que el backend conectara con SQL Server en una PC nueva, incluidos los errores que aparecieron y cómo se resolvieron. Para el diseño (tablas, endpoints, sesiones) ver `DOCUMENTACION_PERSISTENCIA_SQL_SERVER.md`.

**Resumen:** hay que tener SQL Server con TCP/IP habilitado, un login SQL, la base creada, un archivo `.env` en la raíz y dos terminales abiertas (backend y front).

## Requisitos
* Node.js y npm.
* SQL Server (probado con SQL Server Express) y SQL Server Management Studio (SSMS).
* Permisos de administrador sobre la instancia de SQL Server y de Windows en la PC.

## Paso 1: instalar las dependencias
```powershell
npm install
```
Instala también `express`, `mssql`, `bcryptjs` y `dotenv` del backend. Si falta, el servidor falla con `Cannot find package 'express'`.

## Paso 2: tener permisos de administrador en SQL Server
Conectarse en SSMS y ejecutar:
```sql
SELECT @@SERVERNAME, SUSER_NAME(), IS_SRVROLEMEMBER('sysadmin') AS es_admin;
```
`es_admin` debe dar `1`. Si da `0`, el login no puede crear bases (`CREATE DATABASE permission denied`). Se arregla conectándose con un usuario administrador, o agregando el propio usuario de Windows al rol `sysadmin`. Si la instancia es de la empresa, consultarlo antes con IT.

En SSMS, el nombre del servidor tiene el formato `equipo\instancia`, por ejemplo `localhost\SQLEXPRESS`, con "Autenticación de Windows".

## Paso 3: habilitar TCP/IP
El backend se conecta por red. Con TCP/IP deshabilitado, `local_tcp_port` da `NULL` y el backend falla con `Could not connect (sequence)`.

1. Abrir el Configuration Manager: **Windows + R** → `SQLServerManager16.msc` (SQL Server 2022) o `SQLServerManager14.msc` (2017).
2. *Configuración de red de SQL Server* → *Protocolos de SQLEXPRESS* → clic derecho en **TCP/IP** → **Habilitar**.
3. En *Propiedades de TCP/IP* → pestaña *Direcciones IP* → **IPAll**: dejar *Puertos dinámicos TCP* vacío y poner **1433** en *Puerto TCP*.
4. Reiniciar el servicio **SQL Server (SQLEXPRESS)**: en SSMS, clic derecho en el servidor → **Reiniciar**, o `Restart-Service 'MSSQL$SQLEXPRESS' -Force` en PowerShell como administrador.
5. Verificar:
   ```powershell
   Test-NetConnection localhost -Port 1433
   ```
   Debe decir `TcpTestSucceeded : True`.

## Paso 4: crear la base y las tablas
En SSMS, abrir `server/sql/schema.sql` y ejecutarlo completo (F5). Se puede repetir sin problema. Comprobar:
```sql
USE BibliotecaDB;
SELECT name FROM sys.tables;
```
Deben aparecer 7 tablas: `Usuarios`, `Sesiones`, `PreferenciasLectura`, `LibrosVistos`, `Votos`, `Prestamos` y `Stock`.

## Paso 5: crear el login SQL
El backend entra con usuario y clave SQL, no con Windows.

1. SSMS: clic derecho en el servidor → **Propiedades** → **Seguridad** → **Modo de autenticación de SQL Server y Windows**.
2. Reiniciar el **servicio** de SQL Server (no SSMS), como en el paso 3.
3. Ejecutar:
   ```sql
   IF EXISTS (SELECT 1 FROM sys.server_principals WHERE name = 'biblioteca')
       DROP LOGIN biblioteca;
   GO
   CREATE LOGIN biblioteca WITH PASSWORD = 'UnaClaveSegura123!', CHECK_POLICY = OFF;
   ALTER SERVER ROLE sysadmin ADD MEMBER biblioteca;
   GO
   ```
   Ese login tiene permisos totales: sirve para una PC de práctica. En un servidor compartido conviene darle solo `db_owner` sobre `BibliotecaDB`.
4. Probar el login en SSMS ("Autenticación de SQL Server", usuario `biblioteca`) antes de seguir.

## Paso 6: crear el archivo `.env`
Debe estar en la **raíz del proyecto**, al lado de `package.json` (no dentro de `server/`).
```powershell
Copy-Item .env.example .env
```
Contenido:
```
DB_SERVER=localhost
DB_PORT=1433
DB_NAME=BibliotecaDB
DB_USER=biblioteca
DB_PASSWORD=UnaClaveSegura123!
PORT=3001
```
* `DB_PASSWORD` debe ser exactamente la del `CREATE LOGIN`.
* `DB_PORT` es el puerto de **SQL Server**. `PORT` es el del **backend** (3001). No confundirlos.
* Si se usa una instancia por nombre en lugar de puerto, borrar `DB_PORT` y usar `DB_INSTANCE=SQLEXPRESS`: no pueden estar juntos.
* El `.env` está en `.gitignore`: la clave no se sube al repositorio.

## Paso 7: levantar backend y front
Se necesitan **dos terminales abiertas a la vez**:

| Terminal | Comando | Debe mostrar |
|---|---|---|
| 1 (backend) | `npm run server` | `API lista en http://localhost:3001` |
| 2 (front) | `npm run dev` | la dirección de Vite (normalmente `http://localhost:5173`) |

Al arrancar, el backend crea los usuarios `lector` / `123`, `admin` / `admin` y `duenolibreria` / `dueno` si no existen.

## Paso 8: comprobar que persiste
1. Entrar a la app con `lector` / `123`.
2. En SSMS: `SELECT * FROM dbo.Sesiones;` debe mostrar una fila.
3. Completar el quiz, abrir un libro, votar y retirar uno. Revisar `PreferenciasLectura`, `LibrosVistos`, `Votos`, `Prestamos` y `Stock`.
4. Recargar la página: la sesión sigue activa.
5. Cerrar sesión: la fila de `Sesiones` desaparece.

## Errores que aparecieron y qué significan
| Mensaje | Causa | Solución |
|---|---|---|
| `Cannot find package 'express'` | falta instalar dependencias | `npm install` |
| `CREATE DATABASE permission denied in database 'master'` | el login de SSMS no es administrador | paso 2 |
| `Failed to connect to localhost\SQLEXPRESS in 15000ms` | no se encuentra la instancia por nombre (SQL Browser apagado) | usar puerto fijo: pasos 3 y 6 |
| `Failed to connect to localhost:1433 - Could not connect (sequence)` | TCP/IP deshabilitado, servicio sin reiniciar, o no hay SQL Server en esa PC | paso 3 |
| `Login failed for user ''` | el `.env` no se está leyendo (está dentro de `server/`, mal nombrado o falta) | paso 6 |
| `Login failed for user 'biblioteca'` | el login no existe, la clave no coincide, o falta el modo mixto con el reinicio del servicio | paso 5 |
| `Cannot open database "BibliotecaDB"` | falta ejecutar `schema.sql` | paso 4 |
| La app dice "No se pudo conectar con el servidor" | el backend no está corriendo | terminal 1 del paso 7 |
