# 📦 Documento de Entrega de Proyecto - SENA

## 1. Descripción del Proyecto

### Sistema Central de Gestión de Inventario y Pedidos (NeonStore)
Este proyecto consiste en una aplicación web full-stack diseñada bajo una estética visual **Cyberpunk / Grunge** con una paleta de colores oscuros `#0B0813` y destellos de neón morados y azules. Su objetivo principal es optimizar la administración de inventarios en línea y controlar flujos de pedidos en tiempo real. 

El sistema implementa operaciones **CRUD completas** (Crear, Leer, Actualizar y Eliminar) y cuenta con un control estricto de accesos basado en dos roles operativos:
* **Administrador:** Posee facultades completas para inyectar, modificar y purgar productos del catálogo de inventario.
* **Operario (Usuario):** Dispone de una interfaz protegida de solo lectura que le permite realizar búsquedas avanzadas y generar pedidos relacionales restando de forma automática las existencias disponibles.

### Sistema de Gestión de Estudio Gamificado (LUMI)
Como complemento del ecosistema, el proyecto incluye el diseño y desarrollo de la plataforma **LUMI**, un gestor de estudio y tareas enfocado en la organización de actividades de aprendizaje mediante técnicas de gamificación y cronogramas automatizados.

---

## 2. Modelo de Base de Datos (Cloud Firestore)

La persistencia de datos se aloja en línea en una base de datos de Cloud Firestore (Modo Nativo) utilizando una estructura completamente limpia y libre de prefijos. Las colecciones principales se definen de la siguiente manera:

### Colección: `Usuarios`
*Registra la identidad de cada operario autenticado en el sistema y define su nivel de permisos[cite: 1].*
```json
{
  "nombre": "tutu",
  "correo": "tutu@gmail.com",
  "rol": "admin", // Opciones: "admin" | "usuario"
  "fechaAlta": "Timestamp"
}
