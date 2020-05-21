import {JsonDecoder} from "ts.data.json";
import admin from "firebase-admin";
import {randomBytes} from "crypto"
import {categoryDecoder, gameDecoder} from "shared";

interface Entity {
    readonly id: string;
}

export class Repository<TData extends Entity> {
    private readonly collection: string;
    private readonly decoder: JsonDecoder.Decoder<TData>;

    constructor(collection: string, decoder: JsonDecoder.Decoder<TData>) {
        this.collection = collection;
        this.decoder = decoder;
    }

    private decode(documentSnapshot: FirebaseFirestore.DocumentSnapshot) {
        if (!documentSnapshot.exists) {
            return null
        }
        const documentData = documentSnapshot.data();
        const maybeValue = this.decoder.decode(documentData);
        if (!maybeValue.isOk()) {
            console.error(`Could not decode firestore object ${documentSnapshot.ref.path}: ${maybeValue.error}`, documentData)
            return null
        }
        if (maybeValue.value.id !== documentSnapshot.id) {
            console.error(`Mismatch between firestore id and entity id in ${documentSnapshot.ref.path}: ${documentSnapshot.id} !== ${maybeValue.value.id}`, documentData)
        }
        return maybeValue.value;
    }

    async findById(id: string): Promise<TData | null> {
        if (!id) {
            return null
        }
        return this.decode(await admin.firestore().collection(this.collection).doc(id).get())
    }

    async findAll(): Promise<TData[]> {
        const documentSnapshot = await admin.firestore().collection(this.collection).get()
        const values = [];
        for (const doc of documentSnapshot.docs) {
            const value = this.decode(doc)
            if (value) {
                values.push(value);
            }
        }
        return values
    }

    async save(value: TData): Promise<TData> {
        await admin.firestore().collection(this.collection).doc(value.id).set(value)
        return value;
    }

    static generateId(): string {
        const alphabet = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ0123456789";
        const characters = Array.from(randomBytes(20).values())
            .map((value) => alphabet[value % alphabet.length]);
        return "".concat(...characters);
    }
}

export const categoryRepository = new Repository("category", categoryDecoder);
export const gameRepository = new Repository("game", gameDecoder);