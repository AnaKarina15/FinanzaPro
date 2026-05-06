# Usa la imagen oficial de PHP con Apache
FROM php:8.2-apache

# Habilita mod_rewrite de Apache (útil si luego usas .htaccess)
RUN a2enmod rewrite

# 1. Instalar Node.js (necesario para el servidor de notificaciones)
RUN apt-get update && apt-get install -y curl
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
RUN apt-get install -y nodejs

# 2. Copia todo el código de tu proyecto a la carpeta pública de Apache
COPY . /var/www/html/

# 3. Instalar las dependencias del servidor de notificaciones
WORKDIR /var/www/html/functions
RUN npm install

# 4. Volver a la raíz del servidor web
WORKDIR /var/www/html/

# 5. Ajusta los permisos para que Apache pueda leer los archivos
RUN chown -R www-data:www-data /var/www/html/

# Le dice a Render que el servidor corre en el puerto 80
EXPOSE 80

# 6. Comando de inicio dual: Arranca Node.js en segundo plano y luego Apache
CMD node /var/www/html/functions/index.js & apache2-foreground
