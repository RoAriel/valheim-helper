# Despliegue con Docker

Esta guía describe la instalación y operación de Valheim Helper en un servidor doméstico. La misma definición genera contenedores Linux para AMD64 y ARM64; en Windows se ejecuta mediante WSL 2 o Docker Desktop.

## 1. Alcance del despliegue

La aplicación:

- no requiere base de datos, autenticación ni servicios externos;
- no necesita volúmenes persistentes;
- incorpora el catálogo JSON dentro de la imagen;
- escucha en el puerto interno `3000` y en `0.0.0.0`;
- se ejecuta como el usuario no privilegiado `valheim`;
- incluye un healthcheck HTTP;
- se reinicia automáticamente, excepto cuando se detiene manualmente.

Archivos que forman la capa de despliegue:

| Archivo | Responsabilidad |
| --- | --- |
| `Dockerfile` | Instala, compila y genera la imagen mínima de ejecución. |
| `compose.yaml` | Configura puerto, reinicio, healthcheck y restricciones de seguridad. |
| `.dockerignore` | Evita copiar builds, dependencias y archivos locales. |
| `pnpm-workspace.yaml` | Autoriza únicamente los scripts de dependencias revisados. |
| `next.config.ts` | Solicita a Vinext la salida de producción `standalone`. |

## 2. Requisitos del equipo

- Arquitectura `amd64` o `arm64`.
- Linux de 64 bits o Windows con WSL 2/Docker Desktop.
- Docker Engine y Docker Compose V2.
- Git para descargar y actualizar el repositorio.
- Al menos 1 GB de memoria libre durante la compilación.
- Al menos 2 GB libres para imágenes temporales, dependencias y caché de build.

Comprobar arquitectura:

```bash
uname -m
```

Los resultados esperados son `x86_64` para AMD64 o `aarch64`/`arm64` para ARM64.

## 3. Instalar Docker

Sólo se debe seguir uno de los siguientes escenarios.

### 3.1 Windows con Debian en WSL 2

En PowerShell:

```powershell
wsl --version
wsl -l -v
```

La distribución Debian debe usar WSL 2. Dentro de Debian, comprobar el proceso inicial:

```bash
ps -p 1 -o comm=
```

Si no responde `systemd`, crear o editar `/etc/wsl.conf`:

```ini
[boot]
systemd=true
```

Después reiniciar WSL desde PowerShell:

```powershell
wsl --shutdown
```

Volver a abrir Debian y confirmar:

```bash
systemctl is-system-running
```

`running` o `degraded` son respuestas válidas en WSL. Microsoft documenta este procedimiento en [Uso de systemd con WSL](https://learn.microsoft.com/windows/wsl/systemd).

Instalar Docker Engine desde el repositorio oficial dentro de Debian:

```bash
sudo apt update
sudo apt install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/debian/gpg \
  -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
```

```bash
sudo tee /etc/apt/sources.list.d/docker.sources >/dev/null <<EOF
Types: deb
URIs: https://download.docker.com/linux/debian
Suites: $(. /etc/os-release && echo "$VERSION_CODENAME")
Components: stable
Architectures: $(dpkg --print-architecture)
Signed-By: /etc/apt/keyrings/docker.asc
EOF
```

```bash
sudo apt update
sudo apt install -y \
  docker-ce \
  docker-ce-cli \
  containerd.io \
  docker-buildx-plugin \
  docker-compose-plugin
sudo systemctl enable --now docker
```

Permitir el uso de Docker sin `sudo`:

```bash
sudo usermod -aG docker "$USER"
```

El grupo `docker` concede privilegios equivalentes a administrador. Reiniciar WSL otra vez con `wsl --shutdown` para aplicar la pertenencia al grupo.

### 3.2 Linux Debian nativo

Usar los mismos comandos de instalación del apartado anterior, comenzando en `sudo apt update`. Debian 11, 12 y 13, tanto AMD64 como ARM64, están contemplados por el [procedimiento oficial de Docker Engine para Debian](https://docs.docker.com/engine/install/debian/).

No es necesario configurar `/etc/wsl.conf`. Al finalizar:

```bash
sudo systemctl enable --now docker
sudo usermod -aG docker "$USER"
```

Cerrar la sesión del usuario y volver a iniciarla para aplicar el grupo.

### 3.3 Ubuntu nativo o Ubuntu en WSL

No usar el repositorio de Debian. Seguir el [procedimiento oficial de Docker Engine para Ubuntu](https://docs.docker.com/engine/install/ubuntu/) y luego continuar en la sección 4 de esta guía.

### 3.4 Docker Desktop en Windows

También es posible instalar Docker Desktop, habilitar el backend WSL 2 y activar la integración con la distribución que contiene el proyecto. En ese escenario no se instala un segundo Docker Engine dentro de Debian.

Se debe elegir Docker Desktop o Docker Engine dentro de WSL; mantener ambos activos puede producir confusión de contextos y puertos.

## 4. Verificar Docker

Ejecutar en la terminal donde se alojará el proyecto:

```bash
docker version
docker compose version
docker buildx version
docker run --rm hello-world
```

Los cuatro comandos deben terminar correctamente antes de desplegar la aplicación.

## 5. Obtener el proyecto

Para una instalación nueva:

```bash
git clone https://github.com/RoAriel/valheim-helper.git
cd valheim-helper
```

Si el repositorio ya existe:

```bash
cd ~/dev/valheim-helper
git status
```

No se necesitan Node.js ni pnpm instalados en el servidor: ambas herramientas viven dentro de las etapas de construcción de la imagen.

## 6. Construir e iniciar

Desde la raíz del repositorio:

```bash
docker compose up -d --build
```

La primera construcción descarga la imagen base y las dependencias. Las siguientes reutilizan la caché mientras no cambien sus archivos de entrada.

Consultar el estado:

```bash
docker compose ps
```

El resultado esperado después de unos segundos es:

```text
Up ... (healthy)
```

Abrir en el mismo equipo:

```text
http://localhost:3000
```

## 7. Validar la instalación

Comprobar la respuesta HTTP:

```bash
curl --fail --silent --show-error \
  --output /dev/null \
  --write-out 'HTTP %{http_code}\n' \
  http://127.0.0.1:3000/
```

Debe responder `HTTP 200`.

Comprobar el healthcheck:

```bash
docker inspect \
  --format '{{.State.Status}} / {{.State.Health.Status}}' \
  valheim-helper
```

Debe responder `running / healthy`.

Comprobar usuario y arquitectura:

```bash
docker image inspect valheim-helper:1.0.1 \
  --format 'arquitectura={{.Architecture}} usuario={{.Config.User}}'
```

## 8. Acceso desde la red doméstica

Obtener la IP del servidor Linux:

```bash
hostname -I
```

Desde otro dispositivo utilizar, por ejemplo:

```text
http://192.168.1.50:3000
```

En un Linux nativo puede ser necesario habilitar el puerto en el firewall local. Limitarlo a la red doméstica siempre que sea posible.

En WSL, `localhost` funciona desde Windows. El acceso desde otros equipos depende del modo de red y el firewall de Windows. Para un servidor permanente sobre Windows se recomienda Docker Desktop o la red reflejada de WSL; no se debe abrir el puerto al exterior del router.

## 9. Configurar otro puerto

El puerto público puede cambiarse sin modificar archivos.

Linux, WSL o PowerShell:

```bash
VALHEIM_HELPER_PORT=8080 docker compose up -d --build
```

Símbolo del sistema de Windows:

```bat
set VALHEIM_HELPER_PORT=8080
docker compose up -d --build
```

La aplicación quedará disponible en `http://localhost:8080`. El puerto interno continúa siendo `3000`.

## 10. Operación habitual

Estado:

```bash
docker compose ps
```

Registros recientes:

```bash
docker compose logs --tail=100 valheim-helper
```

Seguir registros en tiempo real:

```bash
docker compose logs -f valheim-helper
```

Reiniciar:

```bash
docker compose restart valheim-helper
```

Detener y retirar el contenedor:

```bash
docker compose down
```

`docker compose down` no elimina el repositorio, la imagen construida ni datos del catálogo.

## 11. Actualizar la aplicación

Comprobar primero que no haya modificaciones locales pendientes:

```bash
git status
```

Descargar cambios, reconstruir y sustituir el contenedor:

```bash
git pull --ff-only
docker compose build --pull
docker compose up -d
docker compose ps
```

Como no existen volúmenes ni base de datos, la actualización no requiere migraciones o copias de seguridad de datos de ejecución.

## 12. Volver a una versión anterior

Antes de actualizar, guardar el commit activo:

```bash
git rev-parse HEAD
```

Para volver a un tag o commit conocido:

```bash
git switch --detach <tag-o-commit-anterior>
docker compose up -d --build
```

Para regresar a la rama principal:

```bash
git switch main
docker compose up -d --build
```

## 13. ARM64 y publicación multiplataforma

En un servidor ARM64, `docker compose up -d --build` selecciona automáticamente la variante ARM64 de `node:22-bookworm-slim` y compila las dependencias para esa arquitectura.

Para publicar una única etiqueta con variantes AMD64 y ARM64 se necesita un registro, como Docker Hub o GitHub Container Registry:

```bash
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  --tag <registro>/valheim-helper:1.0.1 \
  --push .
```

`--push` es necesario porque una compilación con varias arquitecturas no puede cargarse como una única imagen en el motor Docker local.

## 14. Seguridad doméstica

- No publicar directamente el puerto `3000` en Internet.
- Para acceso remoto, preferir una VPN doméstica como WireGuard o Tailscale.
- Si se utiliza un dominio, colocar Caddy, Nginx o Traefik delante de la aplicación con HTTPS y autenticación.
- Mantener Docker, el sistema operativo y la imagen base actualizados.
- El contenedor elimina todas las capabilities de Linux y activa `no-new-privileges`.
- El proceso interno usa un usuario sin privilegios.
- El socket de Docker no se monta dentro del contenedor.

## 15. Diagnóstico

### El contenedor no queda saludable

```bash
docker compose ps
docker compose logs --tail=100 valheim-helper
docker inspect --format '{{json .State.Health}}' valheim-helper
```

### El puerto está ocupado

Usar otro puerto público:

```bash
VALHEIM_HELPER_PORT=8080 docker compose up -d
```

### Docker no responde

```bash
systemctl status docker --no-pager
sudo systemctl restart docker
```

En WSL, si `systemctl` no funciona, comprobar `/etc/wsl.conf` y ejecutar `wsl --shutdown` desde PowerShell.

### Error `ERR_PNPM_IGNORED_BUILDS`

Comprobar que `pnpm-workspace.yaml` esté presente en el repositorio y no esté excluido del contexto de Docker. La lista `allowBuilds` autoriza específicamente `esbuild`, `sharp` y `workerd`; no debe sustituirse por una autorización global.

### Reconstrucción completamente limpia

Usar solamente para diagnóstico, porque vuelve a descargar e instalar todas las dependencias:

```bash
docker compose build --no-cache
docker compose up -d --force-recreate
```

## 16. Resultado de referencia

La configuración fue validada en Debian 13 Trixie sobre WSL 2 con Docker Engine:

- imagen Linux AMD64 construida desde cero;
- tamaño aproximado de 106 MB;
- respuesta HTTP `200`;
- estado `running / healthy`;
- cero reinicios durante la validación;
- proceso ejecutado como usuario `valheim`;
- lint y 16 pruebas automatizadas superadas.
