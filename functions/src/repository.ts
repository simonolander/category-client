import {JsonDecoder} from "ts.data.json";
import {randomBytes} from "crypto"
import admin from "firebase-admin";
import {Category, categoryDecoder, fromGameEntity, gameDecoder, GameEntity, IEntity, IStorable, TGame} from "shared";

export interface PaginationOptions {
    readonly limit: number
    readonly startAt?: string
    readonly endAt?: string
    readonly orderByField?: string
    readonly orderByDirection?: "desc" | "asc"
}

export class Repository<TEntity extends IEntity, TClass extends IStorable<TEntity>> {

    constructor(
        protected readonly collection: string,
        protected readonly decoder: JsonDecoder.Decoder<TEntity>,
        protected readonly fromEntity: (entity: TEntity) => TClass | null) {
    }

    protected decode(documentSnapshot: FirebaseFirestore.DocumentSnapshot): TClass | null {
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

    protected async findSnapshotById(id: string) {
        return admin.firestore().collection(this.collection)
            .doc(id)
            .get()
    }

    async findById(id: string): Promise<TClass | null> {
        if (!id) {
            return null
        }
        return this.decode(await this.findSnapshotById(id))
    }

    async findAll(
        options: PaginationOptions = {limit: 1000}
    ): Promise<TClass[]> {
        const collection = admin.firestore().collection(this.collection)
        let query = collection.limit(options.limit)
        if (options.startAt) {
            const snapshot = await this.findSnapshotById(options.startAt)
            if (snapshot) {
                query = query.startAt(snapshot)
            }
        }
        if (options.endAt) {
            const snapshot = await this.findSnapshotById(options.endAt)
            if (snapshot) {
                query = query.endAt(snapshot)
            }
        }
        if (options.orderByField) {
            query = query.orderBy(options.orderByField, options.orderByDirection)
        }
        const documentSnapshot = await query.get()
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

export class GameRepository extends Repository<GameEntity, TGame> {
    private readonly ipAddressDictionary: { [key: string]: Set<string> } = {}

    async findByIpAddress(ipAddress: string): Promise<TGame[]> {
        const gameIds = this.ipAddressDictionary[ipAddress] || []
        const maybeGames = await Promise.all([...gameIds.values()].map(id => this.findById(id)))
        const games = []
        for (const game of maybeGames) {
            if (game) {
                games.push(game)
            }
        }
        return games
    }

    async saveWithIpAddress(game: TGame, ipAddress: string) {
        if (!this.ipAddressDictionary[ipAddress]) {
            this.ipAddressDictionary[ipAddress] = new Set()
        }
        this.ipAddressDictionary[ipAddress].add(game.id)
        return this.save(game)
    }
}

export const categoryRepository = new Repository("category", categoryDecoder, Category.fromEntity);
export const gameRepository = new GameRepository("game", gameDecoder, fromGameEntity);