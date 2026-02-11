# 🚀 PLATAFORMA MULTI-NEGOCIO

Sistema de gestión multi-negocio con campos calculados automáticos y almacenamiento local.

## 📁 Estructura de Archivos

```
proyecto/
├── index.html      # Estructura HTML principal
├── styles.css      # Estilos y diseño responsive
├── app.js          # Lógica JavaScript
└── README.md       # Este archivo
```

## 🎯 Características

✅ **Sistemas dinámicos**: Crea múltiples sistemas de negocios  
✅ **Campos automáticos**: Cálculos, edad, estado de licencia  
✅ **Carga masiva**: Importa 1 o múltiples registros desde JSON  
✅ **Persistencia**: Los datos se guardan en localStorage  
✅ **Responsive**: Funciona en móviles, tablets y escritorio  
✅ **Sin dependencias**: Solo HTML, CSS y JavaScript vanilla  

---

## 🔧 Instalación

1. **Descarga los 3 archivos** en la misma carpeta:
   - `index.html`
   - `styles.css`
   - `app.js`

2. **Abre `index.html`** con tu navegador

¡Listo! No necesitas servidor ni instalaciones.

---

## 📖 Guía de Uso

### **1. Crear un Sistema**

1. Click en "CREAR NUEVO NEGOCIO"
2. Ingresa el nombre (ej: TIENDA, PERSONAS, LICENCIAS)
3. Elige si el ID será automático o manual
4. Agrega campos con sus tipos:
   - **Texto**: Nombre, dirección, DNI
   - **Número**: Precio, cantidad, edad
   - **Select**: Género, estado, categoría
   - **Fecha**: Nacimiento, vencimiento
   - **Calculado**: Total = precio × cantidad
   - **Edad**: Calcula edad desde fecha de nacimiento
   - **Estado Licencia**: VIGENTE o VENCIDA según fecha

---

### **2. Carga Masiva desde JSON**

#### **Opción 1: Un solo registro**
```json
{
  "nombre": "Juan",
  "fecha_nacimiento": "2000-01-01",
  "producto": "leche",
  "precio": 3.50
}
```

#### **Opción 2: Múltiples registros (Array)**
```json
[
  {
    "nombre": "Juan",
    "fecha_nacimiento": "2000-01-01",
    "producto": "leche",
    "precio": 3.50
  },
  {
    "nombre": "María",
    "fecha_nacimiento": "1995-05-15",
    "producto": "pan",
    "precio": 2.00
  },
  {
    "nombre": "Carlos",
    "fecha_nacimiento": "1988-12-20",
    "producto": "huevos",
    "precio": 5.75
  }
]
```

**Cómo usar:**
1. Selecciona tu sistema
2. Pega el JSON en el área de texto
3. Click en "CARGAR"
4. ✅ Todos los registros se insertarán automáticamente

---

## 📝 Ejemplos de Sistemas

### **Ejemplo 1: Sistema TIENDA**

**Campos:**
- Producto (texto)
- Precio (número, 2 decimales)
- Cantidad (número, enteros)
- Total (calculado: precio × cantidad)

**JSON de prueba:**
```json
[
  {"producto": "Laptop", "precio": "1500.00", "cantidad": 2},
  {"producto": "Mouse", "precio": "25.50", "cantidad": 5},
  {"producto": "Teclado", "precio": "75.00", "cantidad": 3}
]
```

---

### **Ejemplo 2: Sistema PERSONAS**

**Campos:**
- Nombre (texto)
- Fecha Nacimiento (fecha)
- Edad (edad automática desde `fecha_nacimiento`)

**JSON de prueba:**
```json
[
  {"nombre": "Ana López", "fecha_nacimiento": "2000-03-15"},
  {"nombre": "Pedro Ruiz", "fecha_nacimiento": "1985-08-22"},
  {"nombre": "Sofía García", "fecha_nacimiento": "1992-11-30"}
]
```

---

### **Ejemplo 3: Sistema LICENCIAS**

**Campos:**
- Conductor (texto)
- Fecha Vencimiento (fecha)
- Estado (license_status desde `fecha_vencimiento`)

**JSON de prueba:**
```json
[
  {"conductor": "Luis Martínez", "fecha_vencimiento": "2027-06-15"},
  {"conductor": "Carmen Díaz", "fecha_vencimiento": "2024-01-01"},
  {"conductor": "Roberto Sánchez", "fecha_vencimiento": "2026-09-30"}
]
```

---

## 🐛 Solución de Problemas

### **❌ Error: "Faltan campos"**
**Causa:** El JSON no incluye todos los campos requeridos  
**Solución:** Verifica que el JSON tenga todos los campos (excepto ID y campos calculados)

### **❌ Los datos no se guardan**
**Causa:** El navegador tiene bloqueado localStorage  
**Solución:** Abre en modo normal (no incógnito) y permite almacenamiento local

### **❌ El ID cambia al editar**
**Causa:** Versión anterior del código  
**Solución:** Usa la versión corregida de `app.js`

### **❌ La edad no se calcula**
**Causa:** El campo `sourceField` no coincide con el nombre del campo  
**Solución:** Si tu campo se llama "Fecha Nacimiento", el `sourceField` debe ser `fecha_nacimiento` (todo minúsculas, con guion bajo)

---

## 🔑 Nombres de Campos (Keys)

Los nombres de campos se convierten automáticamente a formato `snake_case`:

| Nombre ingresado | Key generada |
|------------------|--------------|
| Fecha Nacimiento | fecha_nacimiento |
| Precio Unitario | precio_unitario |
| DNI | dni |
| Número Licencia | numero_licencia |

**Importante:** Al configurar campos calculados, usa siempre el **key** generado, no el nombre visual.

---

## 💾 Backup de Datos

### **Exportar datos:**
1. Copia el contenido del visor JSON inferior
2. Guarda en un archivo `.json`

### **Importar datos:**
1. Abre el archivo JSON
2. Copia el contenido
3. Pégalo en el módulo de carga
4. Click en "CARGAR"

---

## 📱 Compatibilidad

- ✅ Chrome/Edge (recomendado)
- ✅ Firefox
- ✅ Safari
- ✅ Opera
- ✅ Navegadores móviles

---

## ⚠️ Limitaciones

- Los datos se guardan en el navegador (no en servidor)
- No usar en modo incógnito (se borran los datos al cerrar)
- Máximo ~5MB de datos por dominio
- Si borras el cache del navegador, pierdes los datos

---

## 🎨 Personalización

### **Cambiar colores:**
Edita `styles.css` y modifica estas variables:

```css
color: #00ff00;  /* Color verde principal */
background: #1a1a1a;  /* Fondo oscuro */
border-color: #333;  /* Bordes */
```

### **Cambiar fuente:**
```css
font-family: 'Consolas', monospace;
```

---

## 📞 Soporte

Si encuentras errores:
1. Abre la consola del navegador (F12)
2. Ve a la pestaña "Consola"
3. Copia el mensaje de error
4. Busca ayuda con ese mensaje

---

## 📜 Licencia

Uso libre para proyectos personales y comerciales.

---

## 🚀 Próximas Mejoras

- [ ] Exportar a Excel
- [ ] Exportar a PDF
- [ ] Filtros y búsqueda
- [ ] Ordenamiento de columnas
- [ ] Gráficos estadísticos

---

**Versión:** 2.0  
**Última actualización:** Febrero 2026