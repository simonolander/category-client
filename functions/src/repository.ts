import {JsonDecoder} from "ts.data.json";
import {randomBytes} from "crypto"
import admin from "firebase-admin";
import {Category, categoryDecoder, fromGameEntity, gameDecoder, IEntity, IStorable} from "shared";

export class Repository<TEntity extends IEntity, TClass extends IStorable<TEntity>> {

    constructor(
        private readonly collection: string,
        private readonly decoder: JsonDecoder.Decoder<TEntity>,
        private readonly fromEntity: (entity: TEntity) => TClass | null) {
    }

    private decode(documentSnapshot: FirebaseFirestore.DocumentSnapshot): TClass | null {
        if (!documentSnapshot.exists) {
            return null
        }
        const documentData = documentSnapshot.data();
        const maybeEntity = this.decoder.decode(documentData);
        if (!maybeEntity.isOk()) {
            console.error(`Could not decode firestore object ${documentSnapshot.ref.path}: ${maybeEntity.error}`, documentData)
            return null
        }
        if (maybeEntity.value.id !== documentSnapshot.id) {
            console.error(`Mismatch between firestore id and entity id in ${documentSnapshot.ref.path}: ${documentSnapshot.id} !== ${maybeEntity.value.id}`, documentData)
        }
        return this.fromEntity(maybeEntity.value)
    }

    async findById(id: string): Promise<TClass | null> {
        if (!id) {
            return null
        }
        return await admin.firestore().collection(this.collection)
            .doc(id)
            .get()
            .then(snapshot => this.decode(snapshot))
    }

    async findAll(): Promise<TClass[]> {
        const documentSnapshot = await admin.firestore()
            .collection(this.collection)
            .get()
        const values = [];
        for (const doc of documentSnapshot.docs) {
            const value = this.decode(doc)
            if (value) {
                values.push(value);
            }
        }
        return values
    }

    async save(value: TClass): Promise<TClass> {
        const entity = value.toEntity()
        await admin.firestore()
            .collection(this.collection)
            .doc(entity.id)
            .set(entity)
        return value;
    }

    static generateId(): string {
        const alphabet = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ0123456789";
        const characters = Array.from(randomBytes(20).values())
            .map((value) => alphabet[value % alphabet.length]);
        return "".concat(...characters);
    }
}

export const categoryRepository = new Repository("category", categoryDecoder, Category.fromEntity);
export const gameRepository = new Repository("game", gameDecoder, fromGameEntity);