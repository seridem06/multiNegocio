# 🚀 PLATAFORMA MULTI-NEGOCIO CON SQLITE3

Sistema de gestión multi-negocio con campos calculados automáticos y almacenamiento en base de datos SQLite3.

## 📁 Estructura del Proyecto

```
proyecto/
├── backend/
│   ├── app.py              # Servidor Flask (API REST)
│   ├── database.py         # Gestión de SQLite3
│   ├── requirements.txt    # Dependencias Python
│   └── plataforma_negocio.db  # Base de datos (se crea automáticamente)
├── frontend/
│   ├── index.html          # Interfaz HTML
│   ├── styles.css          # Estilos responsive
│   └── app.js              # Lógica JavaScript
└── README.md               # Esta documentación
```

---

## 🔧 Instalación

### **Requisitos:**
- Python 3.8 o superior
- SQLite3 (ya viene incluido con Python)
- Navegador web moderno

### **Paso 1: Instalar Python (si no lo tienes)**

**Windows:**
```bash
# Descarga desde: https://www.python.org/downloads/
# Marca la opción "Add Python to PATH" durante la instalación
```

**Linux/Mac:**
```bash
python3 --version  # Verificar que está instalado
```

### **Paso 2: Instalar dependencias del backend**

```bash
# Ve a la carpeta backend
cd backend

# Instala las dependencias
pip install -r requirements.txt

# O instala manualmente:
pip install Flask==3.0.0 Flask-CORS==4.0.0
```

### **Paso 3: Iniciar el servidor backend**

```bash
# Desde la carpeta backend
python app.py
```

Deberías ver:
```
🚀 Servidor iniciado en http://localhost:5000
```

### **Paso 4: Abrir el frontend**

1. Abre el archivo `frontend/index.html` con tu navegador
2. O usa un servidor local:
   ```bash
   # Opción 1: Python
   cd frontend
   python -m http.server 8080
   # Luego abre: http://localhost:8080

   # Opción 2: VS Code Live Server
   # Click derecho en index.html → "Open with Live Server"
   ```

---

## 🎯 Características

✅ **Base de datos SQLite3**: Todos los datos se guardan permanentemente  
✅ **API REST completa**: Backend Flask con endpoints CRUD  
✅ **Sistemas dinámicos**: Crea múltiples sistemas de negocios  
✅ **Campos automáticos**: Cálculos, edad, estado de licencia  
✅ **Carga masiva**: Importa 1 o múltiples registros desde JSON  
✅ **Persistencia real**: Los datos no se pierden al cerrar el navegador  
✅ **Responsive**: Funciona en móviles, tablets y escritorio  

---

## 📖 Uso Básico

### **1. Crear un Sistema**

1. Click en "CREAR NUEVO NEGOCIO"
2. Configura los campos (texto, número, fecha, calculados, etc.)
3. Click en "GENERAR SISTEMA COMPLETO"

### **2. Registrar Datos**

**Opción A: Formulario visual**
- Llena los campos manualmente
- Click en "REGISTRAR"

**Opción B: Carga masiva JSON**
```json
[
  {"nombre": "Juan", "fecha_nacimiento": "2000-01-01"},
  {"nombre": "María", "fecha_nacimiento": "1995-05-15"},
  {"nombre": "Carlos", "fecha_nacimiento": "1988-12-20"}
]
```
- Pega el JSON en el módulo de carga
- Click en "CARGAR"

---

## 🔌 API Endpoints

### **Esquemas**
```http
GET    /api/schemas              # Listar todos los esquemas
GET    /api/schemas/<nombre>     # Obtener un esquema
POST   /api/schemas              # Crear esquema
DELETE /api/schemas/<nombre>     # Eliminar esquema
```

### **Datos**
```http
GET    /api/data?negocio=X       # Listar datos
GET    /api/data/<id>?negocio=X  # Obtener un dato
POST   /api/data?negocio=X       # Crear dato(s)
PUT    /api/data/<id>?negocio=X  # Actualizar dato
DELETE /api/data/<id>?negocio=X  # Eliminar dato
```

### **Utilidades**
```http
GET /api/health  # Verificar servidor
GET /api/stats   # Estadísticas de la BD
```

---

## 📊 Ejemplo de Uso de la API

### **Crear un esquema:**
```bash
curl -X POST http://localhost:5000/api/schemas \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "PERSONAS",
    "config": {"idAutomatico": true},
    "campos": [
      {"key": "id", "label": "ID", "type": "number"},
      {"key": "nombre", "label": "Nombre", "type": "text"},
      {"key": "fecha_nacimiento", "label": "Fecha Nacimiento", "type": "date"},
      {"key": "edad", "label": "Edad", "type": "age", "sourceField": "fecha_nacimiento"}
    ]
  }'
```

### **Insertar datos:**
```bash
curl -X POST "http://localhost:5000/api/data?negocio=PERSONAS" \
  -H "Content-Type: application/json" \
  -d '[
    {"nombre": "Ana", "fecha_nacimiento": "2000-03-15"},
    {"nombre": "Luis", "fecha_nacimiento": "1985-08-22"}
  ]'
```

### **Obtener datos:**
```bash
curl http://localhost:5000/api/data?negocio=PERSONAS
```

---

## 🗄️ Base de Datos SQLite3

### **Ubicación:**
```
backend/plataforma_negocio.db
```

### **Tablas:**

**`esquemas`**
```sql
id INTEGER PRIMARY KEY
nombre TEXT UNIQUE
config TEXT (JSON)
campos TEXT (JSON)
created_at TIMESTAMP
updated_at TIMESTAMP
```

**`datos`**
```sql
id INTEGER PRIMARY KEY
negocio TEXT
record_id INTEGER
contenido TEXT (JSON)
created_at TIMESTAMP
updated_at TIMESTAMP
UNIQUE(negocio, record_id)
```

### **Consultar la base de datos:**

```bash
# Abrir SQLite3
cd backend
sqlite3 plataforma_negocio.db

# Ver tablas
.tables

# Ver esquemas
SELECT * FROM esquemas;

# Ver datos de un negocio
SELECT * FROM datos WHERE negocio = 'PERSONAS';

# Salir
.quit
```

---

## 🐛 Solución de Problemas

### **❌ Error: "Connection refused" o "Failed to fetch"**
**Causa:** El servidor Flask no está corriendo  
**Solución:**
```bash
cd backend
python app.py
```

### **❌ Error: "ModuleNotFoundError: No module named 'flask'"**
**Causa:** Flask no está instalado  
**Solución:**
```bash
pip install Flask Flask-CORS
```

### **❌ Error: "CORS policy blocked"**
**Causa:** El frontend no está en el mismo dominio  
**Solución:** Ya está configurado Flask-CORS, pero asegúrate de que el backend esté en `localhost:5000`

### **❌ Los datos no aparecen**
**Verificar:**
1. El servidor backend está corriendo
2. La consola del navegador no muestra errores (F12)
3. La URL de la API en `app.js` es correcta (`http://localhost:5000/api`)

---

## 💾 Backup y Restauración

### **Hacer backup:**
```bash
# Copiar el archivo de base de datos
cp backend/plataforma_negocio.db backend/plataforma_negocio_backup.db

# O exportar a SQL
sqlite3 backend/plataforma_negocio.db .dump > backup.sql
```

### **Restaurar backup:**
```bash
# Desde archivo .db
cp backend/plataforma_negocio_backup.db backend/plataforma_negocio.db

# Desde SQL
sqlite3 backend/plataforma_negocio.db < backup.sql
```

---

## 🚀 Despliegue en Producción

### **Backend (Flask):**
```bash
# Instalar gunicorn
pip install gunicorn

# Iniciar servidor de producción
cd backend
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

### **Frontend:**
Simplemente sube los archivos de `frontend/` a cualquier hosting estático:
- Netlify
- Vercel
- GitHub Pages
- AWS S3

**Importante:** Actualiza la URL de la API en `app.js`:
```javascript
const API_URL = 'https://tu-servidor.com/api';  // En producción
```

---

## 📈 Mejoras Futuras

- [ ] Autenticación de usuarios
- [ ] Exportar a Excel/PDF
- [ ] Filtros avanzados
- [ ] Gráficos estadísticos
- [ ] Historial de cambios
- [ ] Permisos por rol

---

## 📞 Soporte Técnico

### **Ver logs del servidor:**
```bash
# El servidor muestra logs en tiempo real en la terminal
# Los errores aparecen con traceback completo
```

### **Ver estadísticas:**
```bash
curl http://localhost:5000/api/stats
```

---

## 📜 Licencia

Uso libre para proyectos personales y comerciales.

---

**Versión:** 2.0 (SQLite3 Edition)  
**Última actualización:** Febrero 2026  
**Stack:** Python + Flask + SQLite3 + Vanilla JavaScript