# 🏦 RepoBase 

Este repositorio es la **plantilla base (template)** oficial para los proyectos en Seguros Bolívar. Está diseñado para garantizar que cada microservicio o aplicación frontend nazca con los estándares de seguridad, arquitectura y calidad exigidos.

## 🚀 Inicio Rápido

1.  En la página de este repositorio en GitHub, haz clic en el botón **"Use this template"**.
2.  Crea tu nuevo repositorio.
3.  Clona el nuevo proyecto en tu máquina local.

## 🔐 Requisitos de Seguridad (Obligatorio)

Este proyecto utiliza el registro privado **JFrog Artifactory**. Para instalar dependencias, **DEBES** configurar tu token personal en tu entorno local. 

### Configuración en Mac (Zsh)
Añade la siguiente línea a tu archivo `~/.zshrc`:

```bash
export JFROG_AUTH_TOKEN="TU_TOKEN_PERSONAL_AQUÍ"
