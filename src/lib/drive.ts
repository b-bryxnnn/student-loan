import { google } from 'googleapis';
import stream from 'stream';

const getDriveAuth = () => {
    if (!process.env.GOOGLE_DRIVE_CREDENTIALS) {
        console.warn("GOOGLE_DRIVE_CREDENTIALS is not set");
        return null;
    }

    try {
        const credentials = JSON.parse(process.env.GOOGLE_DRIVE_CREDENTIALS);
        const auth = new google.auth.GoogleAuth({
            credentials,
            scopes: ['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/drive.readonly'],
        });
        return auth;
    } catch (e) {
        console.error("Error parsing Google Drive credentials", e);
        return null;
    }
};

export const uploadFileToDrive = async (
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string = 'application/pdf'
): Promise<string | null> => {
    const auth = getDriveAuth();
    if (!auth) return null;

    const drive = google.drive({ version: 'v3', auth });
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

    if (!folderId) {
        console.warn("GOOGLE_DRIVE_FOLDER_ID is not set.");
        return null;
    }

    const bufferStream = new stream.PassThrough();
    bufferStream.end(fileBuffer);

    try {
        const response = await drive.files.create({
            requestBody: {
                name: fileName,
                parents: [folderId],
            },
            media: {
                mimeType,
                body: bufferStream,
            },
            fields: 'id',
        });

        return response.data.id || null;
    } catch (error) {
        console.error("Error uploading file to Drive:", error);
        return null;
    }
};

export const getFileMetadata = async (fileId: string) => {
    const auth = getDriveAuth();
    if (!auth) return null;

    const drive = google.drive({ version: 'v3', auth });

    try {
        const response = await drive.files.get({
            fileId,
            fields: 'id, name, mimeType',
        });
        return response.data;
    } catch (error) {
        console.error("Error getting file from Drive:", error);
        return null;
    }
}
