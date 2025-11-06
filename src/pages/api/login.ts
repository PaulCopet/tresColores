import type { APIRoute } from 'astro';
import usuariosData from '../../data/usuarios.json';

export const POST: APIRoute = async ({ request }) => {
    try {
        const { correo, contraseña } = await request.json();

        // Validar que vengan los campos
        if (!correo || !contraseña) {
            return new Response(
                JSON.stringify({
                    success: false,
                    message: 'Todos los campos son obligatorios'
                }),
                {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
        }

        // Buscar el usuario en el JSON
        const usuario = usuariosData.usuarios.find(
            (u) => u.correo.toLowerCase() === correo.toLowerCase()
        );

        // Validar si el usuario existe
        if (!usuario) {
            return new Response(
                JSON.stringify({
                    success: false,
                    message: 'El correo electrónico no está registrado en el sistema'
                }),
                {
                    status: 401,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
        }

        // Validar la contraseña
        if (usuario.contraseña !== contraseña) {
            return new Response(
                JSON.stringify({
                    success: false,
                    message: 'La contraseña es incorrecta'
                }),
                {
                    status: 401,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
        }

        // Login exitoso - No devolver la contraseña
        const { contraseña: _, ...usuarioSinContraseña } = usuario;

        return new Response(
            JSON.stringify({
                success: true,
                message: `Bienvenido ${usuario.nombre}`,
                usuario: usuarioSinContraseña
            }),
            {
                status: 200,
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

    } catch (error) {
        return new Response(
            JSON.stringify({
                success: false,
                message: 'Error en el servidor'
            }),
            {
                status: 500,
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
    }
};
