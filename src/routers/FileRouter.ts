import express from "express";
import multer from "multer";
import strings from "../constants/strings";
import authenticate from "../middleware/authenticate";

const upload = multer({
    dest: './upload/',
});

const FileRouter = express.Router();

FileRouter.post('/upload', authenticate,  upload.single('file'), async (req, res) => {
    res.status(200).json({msg: strings.file_success, file: req.file?.filename});
});

export default FileRouter;