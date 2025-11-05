# Sistema de Autenticación - Tres Colores

## Credenciales de Prueba

### Usuario Administrador
- **Correo:** admin@trescolores.com
- **Contraseña:** Admin123!
- **Rol:** admin

### Usuario Registrado
- **Correo:** juan.perez@correo.com
- **Contraseña:** Usuario123!
- **Rol:** usuario

## Funcionalidades Implementadas

### ✅ Historia de Usuario: Inicio de Sesión

1. **Acceso al formulario**
   - El botón "Ingresar" aparece en el header de la aplicación
   - Al hacer clic, se abre un modal con el formulario de login

2. **Campos obligatorios**
   - Correo electrónico
   - Contraseña
   - Ambos campos están validados

3. **Validaciones del sistema**
   - ✅ Verifica que el correo exista en la base de datos
   - ✅ Valida que la contraseña coincida con la registrada
   - ✅ Verifica formato válido de correo electrónico
   - ✅ Comprueba que los campos no estén vacíos

4. **Mensajes de error específicos**
   - "El correo electrónico es obligatorio"
   - "La contraseña es obligatoria"
   - "El correo electrónico no es válido"
   - "El correo electrónico no está registrado en el sistema"
   - "La contraseña es incorrecta"

5. **Login exitoso**
   - Muestra mensaje: "Bienvenido [nombre del usuario]"
   - Permite acceso al calendario interactivo
   - Muestra información del usuario en el header

6. **Gestión de sesión**
   - La sesión se guarda en localStorage
   - Permanece activa al recargar la página
   - El usuario puede cerrar sesión con el botón "Salir"

## Animaciones GSAP

- ✨ Entrada del modal con efecto bounce
- ✨ Mensaje de bienvenida animado
- ✨ Transiciones suaves en todos los elementos

## Arquitectura

```
src/
├── components/
│   ├── Header.tsx           # Header con login/logout
│   └── LoginModal.tsx       # Modal de autenticación
├── data/
│   └── usuarios.json        # Base de datos de usuarios
├── pages/
│   └── api/
│       └── login.ts         # Endpoint de autenticación
└── backend/
    └── logic/
        └── models.ts        # Modelo UsuarioModel
```
