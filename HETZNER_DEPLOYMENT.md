# Deployment en Servidor Hetzner Dedicado

Guia completa para desplegar el sistema de video en un servidor Hetzner con MariaDB.

## Requisitos del Servidor

- Ubuntu 22.04 LTS o superior
- Node.js 20.x o superior
- MariaDB 10.6 o superior
- Nginx (como reverse proxy)
- PM2 (process manager)
- Git

---

## 1. Preparar el Servidor

```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar dependencias basicas
sudo apt install -y curl wget git build-essential
```

---

## 2. Instalar Node.js 20

```bash
# Instalar Node.js via NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verificar instalacion
node -v
npm -v
```

---

## 3. Instalar MariaDB

```bash
# Instalar MariaDB
sudo apt install -y mariadb-server mariadb-client

# Iniciar y habilitar servicio
sudo systemctl start mariadb
sudo systemctl enable mariadb

# Configurar seguridad (seguir las instrucciones)
sudo mysql_secure_installation
```

### Crear Base de Datos y Usuario

```bash
# Entrar a MariaDB
sudo mysql -u root -p

# Ejecutar estos comandos SQL:
CREATE DATABASE videodb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'videoapp'@'localhost' IDENTIFIED BY 'TU_PASSWORD_SEGURO';
GRANT ALL PRIVILEGES ON videodb.* TO 'videoapp'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### Crear Tablas

```bash
# Ejecutar el script de esquema
sudo mysql -u videoapp -p videodb < /ruta/al/proyecto/scripts/mariadb-schema.sql
```

---

## 4. Clonar y Configurar el Proyecto

```bash
# Crear directorio para la aplicacion
sudo mkdir -p /var/www/videoapp
sudo chown $USER:$USER /var/www/videoapp
cd /var/www/videoapp

# Clonar repositorio (reemplaza con tu repo)
git clone https://github.com/TU_USUARIO/TU_REPO.git .

# Instalar dependencias
npm install
```

### Configurar Variables de Entorno

```bash
# Crear archivo .env
nano .env
```

Contenido del archivo `.env`:

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=videodb
DB_USER=videoapp
DB_PASSWORD=TU_PASSWORD_SEGURO

# App
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://tudominio.com
```

### Compilar la Aplicacion

```bash
npm run build
```

---

## 5. Instalar PM2 y Configurar

```bash
# Instalar PM2 globalmente
sudo npm install -g pm2

# Iniciar la aplicacion
pm2 start npm --name "videoapp" -- start

# Guardar configuracion para reinicio automatico
pm2 save

# Configurar PM2 para iniciar al boot
pm2 startup systemd
```

---

## 6. Configurar Nginx

```bash
# Instalar Nginx
sudo apt install -y nginx

# Crear configuracion del sitio
sudo nano /etc/nginx/sites-available/videoapp
```

Contenido de la configuracion:

```nginx
server {
    listen 80;
    server_name tudominio.com www.tudominio.com;

    # Redirigir a HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name tudominio.com www.tudominio.com;

    # SSL (configurar con Certbot)
    ssl_certificate /etc/letsencrypt/live/tudominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tudominio.com/privkey.pem;

    # Seguridad SSL
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;

    # Proxy a Next.js
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Cache para assets estaticos
    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # Limite de tamanio para uploads
    client_max_body_size 100M;
}
```

```bash
# Activar sitio
sudo ln -s /etc/nginx/sites-available/videoapp /etc/nginx/sites-enabled/

# Verificar configuracion
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
```

---

## 7. Configurar SSL con Certbot

```bash
# Instalar Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtener certificado SSL
sudo certbot --nginx -d tudominio.com -d www.tudominio.com

# Verificar renovacion automatica
sudo certbot renew --dry-run
```

---

## 8. Configurar Firewall

```bash
# Instalar y configurar UFW
sudo apt install -y ufw

# Reglas basicas
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'

# Activar firewall
sudo ufw enable
```

---

## 9. Comandos Utiles

```bash
# Ver logs de la aplicacion
pm2 logs videoapp

# Reiniciar aplicacion
pm2 restart videoapp

# Ver estado de la aplicacion
pm2 status

# Actualizar aplicacion
cd /var/www/videoapp
git pull
npm install
npm run build
pm2 restart videoapp

# Ver logs de Nginx
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# Backup de base de datos
mysqldump -u videoapp -p videodb > backup_$(date +%Y%m%d).sql
```

---

## 10. Monitoreo (Opcional)

```bash
# Instalar htop para monitoreo
sudo apt install -y htop

# Configurar PM2 monit
pm2 monit
```

---

## Solucion de Problemas

### Error de conexion a la base de datos
- Verificar que MariaDB este corriendo: `sudo systemctl status mariadb`
- Verificar credenciales en `.env`
- Verificar que el usuario tenga permisos: `SHOW GRANTS FOR 'videoapp'@'localhost';`

### La aplicacion no inicia
- Ver logs: `pm2 logs videoapp --lines 100`
- Verificar que el build fue exitoso: `npm run build`
- Verificar variables de entorno: `pm2 env 0`

### Error 502 Bad Gateway
- Verificar que la app este corriendo: `pm2 status`
- Verificar configuracion de Nginx: `sudo nginx -t`
- Verificar logs de Nginx

---

## Estructura de Archivos en el Servidor

```
/var/www/videoapp/
├── .env                 # Variables de entorno
├── .next/               # Build de Next.js
├── node_modules/        # Dependencias
├── package.json
├── scripts/
│   └── mariadb-schema.sql
└── ...
```

---

## 11. Sistema de Dominios por Usuario

Cada usuario puede agregar sus propios dominios desde su panel. Los dominios se activan automaticamente.

### Como funciona

1. El usuario agrega un dominio desde su panel (ej: `midominio.com`)
2. El dominio se activa automaticamente
3. El usuario configura su DNS para que apunte a la IP del servidor
4. Los posts del usuario son accesibles desde ese dominio: `midominio.com/?p=123`

### Configuracion DNS (el usuario debe hacer esto)

El usuario debe configurar un registro A en su proveedor de DNS:

```
Tipo: A
Nombre: @ (o el subdominio)
Valor: IP_DEL_SERVIDOR
TTL: 3600
```

### Configurar Nginx para multiples dominios

Nginx debe aceptar cualquier dominio y pasarlo a la aplicacion:

```nginx
# /etc/nginx/sites-available/videoapp

server {
    listen 80;
    listen [::]:80;
    
    # Aceptar cualquier dominio
    server_name _;
    
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Logica de dominios

- Cuando alguien accede a `midominio.com/?p=123`:
  1. El sistema busca `midominio.com` en la tabla `user_domains`
  2. Obtiene el `user_id` del dueno del dominio
  3. Busca el post `123` que pertenezca a ese usuario
  4. Si existe, muestra el video; si no, muestra error 404

### Tabla de dominios

La tabla `user_domains` almacena:
- `id`: ID unico del dominio
- `user_id`: ID del usuario propietario
- `domain`: Nombre del dominio (ej: midominio.com)
- `status`: Estado (active, suspended)
