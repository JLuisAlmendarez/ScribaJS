const mongoose = require('mongoose');
const sanitizeHtml = require('sanitize-html');

class Document {
    constructor(document_id, name, content) {
        this.document_id = document_id;
        this.name = name;
        this.created_at = new Date();
        this.content = Document.sanitizeContent(content);
    }

    // Método estático para sanitizar contenido HTML
    static sanitizeContent(content) {
        const options = {
            allowedTags: [ 
                'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'p', 'ul', 'ol',
                'nl', 'li', 'b', 'i', 'strong', 'em', 'strike', 'code', 'hr', 'br',
                'div', 'table', 'thead', 'caption', 'tbody', 'tr', 'th', 'td', 'pre',
                'span', 'a'
            ],
            allowedAttributes: {
                'a': [ 'href', 'name', 'target' ],
                'img': [ 'src', 'alt' ],
                'div': ['class'],
                'span': ['class'],
                'table': ['class'],
                'td': ['class']
            },
            disallowedTagsMode: 'discard',
            allowedSchemes: [ 'http', 'https', 'ftp', 'mailto' ]
        };
        return sanitizeHtml(content, options);
    }

    updateContent(newContent) {
        this.content = Document.sanitizeContent(newContent);
        return this;
    }

    getInfo() {
        return {
            id: this.document_id,
            name: this.name,
            created_at: this.created_at,
            content: this.content
        };
    }
}

class HTMLDocuments {
    constructor() {
        this.documents = new Map();
        this.count = 0;
    }

    async addDocument(name, content) {
        try {
            const docModel = await mongoose.model('Document').create({
                name: name,
                content: Document.sanitizeContent(content),
                created_at: new Date()
            });
            const document_id = docModel._id.toString();
            const newDoc = new Document(document_id, name, content);
            this.documents.set(document_id, newDoc);
            this.count++;
            return document_id;
        } catch (error) {
            throw new Error(`Error al crear documento: ${error.message}`);
        }
    }

    async getDocument(document_id) {
        try {
            const doc = await mongoose.model('Document').findById(document_id);
            if (!doc) return null;
            return new Document(doc._id, doc.name, doc.content);
        } catch (error) {
            throw new Error(`Error al obtener documento: ${error.message}`);
        }
    }

    async getAllDocuments() {
        try {
            const docs = await mongoose.model('Document').find();
            return docs.map(doc => new Document(doc._id, doc.name, doc.content));
        } catch (error) {
            throw new Error(`Error al obtener documentos: ${error.message}`);
        }
    }

    async removeDocument(document_id) {
        try {
            const result = await mongoose.model('Document').findByIdAndDelete(document_id);
            if (result) {
                const deleted = this.documents.delete(document_id);
                if (deleted) this.count--;
                return true;
            }
            return false;
        } catch (error) {
            throw new Error(`Error al eliminar documento: ${error.message}`);
        }
    }
}

class User {
    constructor(user_id, email, password) {
        this.user_id = user_id;
        this.email = email;
        this.password = password;
        this.html_documents = new HTMLDocuments();
    }

    authenticate(inputPassword) {
        return this.password === inputPassword;
    }

    async createDocument(name, content) {
        return await this.html_documents.addDocument(name, content);
    }

    async getAllDocuments() {
        return await this.html_documents.getAllDocuments();
    }

    getDocumentCount() {
        return this.html_documents.count;
    }

    updatePassword(newPassword) {
        this.password = newPassword;
        return this;
    }

    async deleteUser() {
        try {
            const documentos = await this.html_documents.getAllDocuments();
            for (const doc of documentos) {
                await this.html_documents.removeDocument(doc.document_id);
            }
            await mongoose.model('User').findByIdAndDelete(this.user_id);
            this.email = null;
            this.password = null;
            this.user_id = null;
            this.html_documents = null;
            return true;
        } catch (error) {
            throw new Error(`Error al eliminar usuario: ${error.message}`);
        }
    }
}

module.exports = User;