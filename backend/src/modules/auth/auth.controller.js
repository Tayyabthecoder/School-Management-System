const authService = require('./auth.service')
const { logAudit } = require('../../utils/audit-log.util')

const login = async (req, res, next) => {
  try {
    const { username, password } = req.body
    if (!username || !password) {
      return res.status(400).json({ success: false, error: { message: 'Username and password are required' } })
    }

    const result = await authService.login(username, password)

    // Set refresh token in HTTP-only cookie with strict security flags
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api/v1/auth',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })

    await logAudit({ req: { user: { _id: result.user.id, username: result.user.username } }, action: 'USER_LOGIN', module: 'auth' })

    res.json({
      success: true,
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    })
  } catch (error) {
    next(error)
  }
}

const refreshToken = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken
    if (!token) {
      return res.status(401).json({ success: false, error: { message: 'Refresh token cookie required' } })
    }
    const result = await authService.refreshToken(token)
    if (result.refreshToken) {
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/api/v1/auth',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
    }
    res.json({
      success: true,
      data: {
        accessToken: result.accessToken,
      },
    })
  } catch (error) {
    next(error)
  }
}

const logout = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken
    if (token) {
      await authService.revokeRefreshToken(token)
    }
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api/v1/auth',
    })
    if (req.user) {
      await logAudit({ req, action: 'USER_LOGOUT', module: 'auth' })
    }
    res.json({ success: true, message: 'Logged out successfully' })
  } catch (error) {
    next(error)
  }
}

const getMe = async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: {
        id: req.user._id,
        username: req.user.username,
        role: req.user.roleName,
        studentId: req.user.studentId,
        staffId: req.user.staffId,
        mustChangePassword: req.user.mustChangePassword || false,
      },
    })
  } catch (error) {
    next(error)
  }
}

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body
    const result = await authService.changePassword(req.user._id, currentPassword, newPassword)
    await logAudit({ req, action: 'CHANGE_PASSWORD', module: 'auth' })
    res.json(result)
  } catch (error) {
    next(error)
  }
}

module.exports = { login, refreshToken, logout, getMe, changePassword }
