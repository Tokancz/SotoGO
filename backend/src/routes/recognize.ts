// Photo-based vehicle recognition (capture flow). Auth-required — it spends a
// vision API call per request, so it shouldn't be open. Accepts the catch photo
// as multipart/form-data ("photo") and returns { fleetNumber, category, candidates }.
import { Router } from 'express'
import multer from 'multer'
import { config } from '../config.js'
import { requireAuth } from '../middleware/auth.js'
import { asyncHandler } from '../util/asyncHandler.js'
import { isAllowedImage } from '../lib/uploads.js'
import { recognitionEnabled, recognizeVehicle } from '../lib/recognize.js'

export const recognizeRouter = Router()
recognizeRouter.use(requireAuth)

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.maxUploadBytes },
  fileFilter: (_req, file, cb) => cb(null, isAllowedImage(file.mimetype)),
})

recognizeRouter.post(
  '/',
  upload.single('photo'),
  asyncHandler(async (req, res) => {
    if (!recognitionEnabled()) {
      res.status(503).json({ error: 'Rozpoznávání není nastavené.' })
      return
    }
    if (!req.file) {
      res.status(400).json({ error: 'Chybí fotka.' })
      return
    }
    const result = await recognizeVehicle(req.file.buffer, req.file.mimetype)
    res.json(result)
  }),
)
