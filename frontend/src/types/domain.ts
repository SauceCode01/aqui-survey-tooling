// ============================================================================
// Core Domain Types: Users & Posts (Fullstack Template)
// ============================================================================

export interface User {
	id: string;
	firstname: string;
	lastname: string;
	age: number;
	createdAt: string;
	updatedAt: string;
}

export interface CreateUserInput {
	firstname: string;
	lastname: string;
	age: number;
}

export interface Post {
	id: string;
	userId: string;
	title: string;
	content: string;
	createdAt: string | { millis: number };
	updatedAt: string | { millis: number };
}

export interface CreatePostInput {
	userId: string;
	title: string;
	content: string;
}

export interface PostWithAuthor {
	post: Post;
	author: User;
}

export interface BackendHealth {
	status: string;
	service?: string;
	timestamp?: string;
	uptime?: number;
}

export interface ApiCallLog {
	id: string;
	timestamp: string;
	method: "GET" | "POST" | "DELETE" | "PUT" | "PATCH";
	url: string;
	status: number;
	statusText: string;
	durationMs: number;
	requestPayload?: unknown;
	responsePayload?: unknown;
	isError?: boolean;
}

// ============================================================================
// Shared & Legacy UI Types (Preserved for compatibility)
// ============================================================================

export type StructureType = "ORGANIZATION" | "DIVISION" | "DEPARTMENT" | "TEAM";

export type ResourceType =
	| "CYCLE"
	| "PROJECT"
	| "PHASE"
	| "MILESTONE"
	| "TASK"
	| "THREAD";

export type Permission =
	| "VIEW"
	| "CREATE"
	| "EDIT"
	| "DELETE"
	| "MANAGE_ACCESS"
	| "COMMENT"
	| "LEADER"
	| "OWNER"
	| "OVERSEER"
	| "HEAD";

export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE" | "BLOCKED";

export interface StructureNode {
	id: string;
	name: string;
	description?: string;
	type: StructureType;
	parentId?: string | null;
	resourceId: string;
	isRestricted?: boolean;
	memberCount?: number;
	children?: StructureNode[];
}

export interface Organization extends StructureNode {
	type: "ORGANIZATION";
	ownerCredId?: string;
}

export interface Division extends StructureNode {
	type: "DIVISION";
}

export interface Department extends StructureNode {
	type: "DEPARTMENT";
}

export interface Team extends StructureNode {
	type: "TEAM";
}

export interface WorkResourceNode {
	id: string;
	name: string;
	description?: string;
	type: ResourceType;
	parentId?: string | null;
	resourceId: string;
	isRestricted?: boolean;
	deadline?: string;
}

export interface Task extends WorkResourceNode {
	type: "TASK";
	status: TaskStatus;
	assigneeCredIds: string[];
	tags: string[];
}

export interface Comment {
	id: string;
	threadId: string;
	authCredId: string;
	authorName: string;
	authorAvatar?: string;
	content: string;
	createdAt: string;
	replyTo?: string | null;
	hasSubThread?: boolean;
	likesCount?: number;
	replies?: Comment[];
}

export interface Thread {
	id: string;
	targetResourceId: string;
	resourceId: string;
	comments: Comment[];
}
