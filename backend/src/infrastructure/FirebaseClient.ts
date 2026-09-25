import { type DepsType, MakeInjectable } from "@solid-stack/di";
import {
	cert,
	getApps,
	initializeApp,
	type ServiceAccount,
} from "firebase-admin/app";
import { type Auth, getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

@MakeInjectable
export class FirebaseClient {
	public db: FirebaseFirestore.Firestore;
	public auth: Auth;

	public static deps = {};
	constructor(public deps: DepsType<typeof FirebaseClient.deps>) {
		const serviceAccount: ServiceAccount = {
			projectId: process.env.FIREBASE_PROJECT_ID,
			clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
			privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
		};

		// 2. Use modern modular functions instead of admin.*
		if (!getApps().length) {
			initializeApp({
				credential: cert(serviceAccount),
			});
		}

		// 3. Use getFirestore() and getAuth() to initialize instances
		this.db = getFirestore();
		this.auth = getAuth();
	}

	/**
	 * Option A: Create a document with an AUTO-GENERATED ID
	 */
	public async createWithAutoId(collectionName: string, data: object) {
		const colRef = this.db.collection(collectionName);
		const docRef = await colRef.add(data);

		console.log(`Document created with ID: ${docRef.id}`);
		return docRef.id;
	}

	/**
	 * Option B: Create or overwrite a document with a CUSTOM ID
	 */
	public async createWithCustomId(
		collectionName: string,
		docId: string,
		data: object,
	) {
		const docRef = this.db.collection(collectionName).doc(docId);
		await docRef.set(data);

		console.log(`Document created/updated with ID: ${docId}`);
	}
}
