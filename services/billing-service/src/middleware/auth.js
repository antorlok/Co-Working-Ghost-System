const jwt = require('jsonwebtoken');
require('dotenv').config();

const secretKey = process.env.SECRET_KEY || 'coworking_secret_key_change_me_in_prod';

// Middleware para verificar la firma del JWT autocontenido
function verificarJWT(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Se requiere token de autenticación (Authorization header vacío o inválido)' });
  }

  const token = authHeader.substring(7); // Quitar 'Bearer '

  try {
    const payload = jwt.verify(token, secretKey);
    
    // Guardar los datos en el objeto del request para los siguientes middlewares o controladores
    req.usuarioEmail = payload.sub;
    req.usuarioId = parseInt(payload.id, 10);
    req.usuarioRole = payload.role;

    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

// Middleware de seguridad para restringir el acceso únicamente a usuarios administradores
function soloAdmin(req, res, next) {
  if (!req.usuarioRole) {
    return res.status(401).json({ error: 'Falta información de autenticación' });
  }

  if (req.usuarioRole !== 'admin') {
    return res.status(403).json({ error: 'No tienes permisos suficientes para realizar esta acción (Solo Administradores)' });
  }

  next();
}

module.exports = {
  verificarJWT,
  soloAdmin,
};
