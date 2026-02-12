from flask import Flask, request, jsonify
from flask_cors import CORS
from Database import Database
import traceback

app = Flask(__name__)
CORS(app)  # Permitir peticiones desde el frontend

# Inicializar base de datos
db = Database()

# ==================== MANEJO DE ERRORES ====================

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint no encontrado'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Error interno del servidor'}), 500

# ==================== ENDPOINTS DE ESQUEMAS ====================

@app.route('/api/schemas', methods=['GET'])
def get_schemas():
    """Obtener todos los esquemas"""
    try:
        esquemas = db.get_esquemas()
        return jsonify(esquemas), 200
    except Exception as e:
        print(f"Error en get_schemas: {traceback.format_exc()}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/schemas/<nombre>', methods=['GET'])
def get_schema(nombre):
    """Obtener un esquema específico"""
    try:
        esquema = db.get_esquema(nombre)
        if esquema:
            return jsonify(esquema), 200
        return jsonify({'error': 'Esquema no encontrado'}), 404
    except Exception as e:
        print(f"Error en get_schema: {traceback.format_exc()}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/schemas', methods=['POST'])
def create_schema():
    """Crear un nuevo esquema"""
    try:
        data = request.get_json()
        
        if not data or 'nombre' not in data or 'campos' not in data:
            return jsonify({'error': 'Faltan campos obligatorios'}), 400
        
        nombre = data['nombre']
        config = data.get('config', {})
        campos = data['campos']
        
        esquema = db.create_esquema(nombre, config, campos)
        return jsonify(esquema), 201
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        print(f"Error en create_schema: {traceback.format_exc()}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/schemas/<nombre>', methods=['DELETE'])
def delete_schema(nombre):
    """Eliminar un esquema"""
    try:
        deleted = db.delete_esquema(nombre)
        if deleted:
            return jsonify({'message': 'Esquema eliminado correctamente'}), 200
        return jsonify({'error': 'Esquema no encontrado'}), 404
    except Exception as e:
        print(f"Error en delete_schema: {traceback.format_exc()}")
        return jsonify({'error': str(e)}), 500

# ==================== ENDPOINTS DE DATOS ====================

@app.route('/api/data', methods=['GET'])
def get_data():
    """Obtener todos los datos de un negocio"""
    try:
        negocio = request.args.get('negocio')
        
        if not negocio:
            return jsonify({'error': 'Parámetro "negocio" requerido'}), 400
        
        datos = db.get_datos(negocio)
        return jsonify(datos), 200
        
    except Exception as e:
        print(f"Error en get_data: {traceback.format_exc()}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/data/<int:record_id>', methods=['GET'])
def get_data_by_id(record_id):
    """Obtener un dato específico"""
    try:
        negocio = request.args.get('negocio')
        
        if not negocio:
            return jsonify({'error': 'Parámetro "negocio" requerido'}), 400
        
        dato = db.get_dato(negocio, record_id)
        
        if dato:
            return jsonify(dato), 200
        return jsonify({'error': 'Dato no encontrado'}), 404
        
    except Exception as e:
        print(f"Error en get_data_by_id: {traceback.format_exc()}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/data', methods=['POST'])
def create_data():
    """Crear uno o múltiples datos"""
    try:
        negocio = request.args.get('negocio')
        
        if not negocio:
            return jsonify({'error': 'Parámetro "negocio" requerido'}), 400
        
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No se recibieron datos'}), 400
        
        # Verificar si es un array o un objeto único
        if isinstance(data, list):
            # Carga masiva
            resultados = db.create_datos_bulk(negocio, data)
            return jsonify({
                'message': f'{len(resultados)} registro(s) creado(s)',
                'data': resultados
            }), 201
        else:
            # Un solo registro
            resultado = db.create_dato(negocio, data)
            return jsonify(resultado), 201
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        print(f"Error en create_data: {traceback.format_exc()}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/data/<int:record_id>', methods=['PUT'])
def update_data(record_id):
    """Actualizar un dato existente"""
    try:
        negocio = request.args.get('negocio')
        
        if not negocio:
            return jsonify({'error': 'Parámetro "negocio" requerido'}), 400
        
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No se recibieron datos'}), 400
        
        resultado = db.update_dato(negocio, record_id, data)
        return jsonify(resultado), 200
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 404
    except Exception as e:
        print(f"Error en update_data: {traceback.format_exc()}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/data/<int:record_id>', methods=['DELETE'])
def delete_data(record_id):
    """Eliminar un dato"""
    try:
        negocio = request.args.get('negocio')
        
        if not negocio:
            return jsonify({'error': 'Parámetro "negocio" requerido'}), 400
        
        deleted = db.delete_dato(negocio, record_id)
        
        if deleted:
            return jsonify({'message': 'Dato eliminado correctamente'}), 200
        return jsonify({'error': 'Dato no encontrado'}), 404
        
    except Exception as e:
        print(f"Error en delete_data: {traceback.format_exc()}")
        return jsonify({'error': str(e)}), 500

# ==================== ENDPOINTS DE UTILIDAD ====================

@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Obtener estadísticas de la base de datos"""
    try:
        stats = db.get_stats()
        return jsonify(stats), 200
    except Exception as e:
        print(f"Error en get_stats: {traceback.format_exc()}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Verificar que el servidor está funcionando"""
    return jsonify({
        'status': 'ok',
        'message': 'Servidor funcionando correctamente'
    }), 200

@app.route('/', methods=['GET'])
def index():
    """Página de inicio de la API"""
    return jsonify({
        'message': 'API Plataforma Multi-Negocio',
        'version': '1.0',
        'endpoints': {
            'schemas': {
                'GET /api/schemas': 'Listar todos los esquemas',
                'GET /api/schemas/<nombre>': 'Obtener un esquema',
                'POST /api/schemas': 'Crear un esquema',
                'DELETE /api/schemas/<nombre>': 'Eliminar un esquema'
            },
            'data': {
                'GET /api/data?negocio=X': 'Listar datos de un negocio',
                'GET /api/data/<id>?negocio=X': 'Obtener un dato',
                'POST /api/data?negocio=X': 'Crear dato(s) [objeto o array]',
                'PUT /api/data/<id>?negocio=X': 'Actualizar un dato',
                'DELETE /api/data/<id>?negocio=X': 'Eliminar un dato'
            },
            'utils': {
                'GET /api/health': 'Health check',
                'GET /api/stats': 'Estadísticas'
            }
        }
    }), 200

# ==================== CONFIGURACIÓN ====================

if __name__ == '__main__':
    print("=" * 60)
    print("🚀 Servidor iniciado en http://localhost:5000")
    print("=" * 60)
    print("📊 Endpoints disponibles:")
    print("  - GET    /api/schemas")
    print("  - POST   /api/schemas")
    print("  - DELETE /api/schemas/<nombre>")
    print("  - GET    /api/data?negocio=X")
    print("  - POST   /api/data?negocio=X")
    print("  - PUT    /api/data/<id>?negocio=X")
    print("  - DELETE /api/data/<id>?negocio=X")
    print("  - GET    /api/stats")
    print("=" * 60)
    
    app.run(debug=True, host='0.0.0.0', port=5000)