import { Request, Response } from 'express';
import  {fetchDocumentsFromDB} from '../../Models/userModel'; 

export async function getdocuments(req: Request, res: Response) {
    try {
        // Assuming you have a function to fetch documents from the database
        const documents = await fetchDocumentsFromDB(); 
        return res.status(200).json({ documents })
    } catch (err) {
        console.error('[Get Documents Error]', err);
        return res.status(500).json({ error: 'Failed to fetch documents' });
    }
}