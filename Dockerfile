# Usa la imagen oficial de PHP con Apache
FROM php:8.2-apache

# Habilita mod_rewrite de Apache (útil si luego usas .htaccess)
RUN a2enmod rewrite

# Copia todo el código de tu proyecto a la carpeta pública de Apache
COPY . /var/www/html/

# Ajusta los permisos para que Apache pueda leer los archivos
RUN chown -R www-data:www-data /var/www/html/

# Le dice a Render que el servidor corre en el puerto 80
EXPOSE 80
