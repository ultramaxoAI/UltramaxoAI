/**
 * File upload validation utilities
 * Enforce size limits and allowed file types
 */

// Maximum file sizes (in bytes)
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB default
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB for images
export const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024; // 10MB for documents

// Allowed MIME types
export const ALLOWED_IMAGE_TYPES = [
	"image/jpeg",
	"image/jpg",
	"image/png",
	"image/gif",
	"image/webp",
	"image/svg+xml",
];

export const ALLOWED_DOCUMENT_TYPES = [
	"application/pdf",
	"text/plain",
	"text/markdown",
	"text/csv",
	"application/json",
	"application/xml",
	"application/zip",
	"application/x-zip-compressed",
	"application/x-php",
	"application/x-httpd-php",
	"text/x-php",
	"text/javascript",
	"text/typescript",
	"text/html",
	"text/css",
];

export const ALLOWED_FILE_TYPES = [
	...ALLOWED_IMAGE_TYPES,
	...ALLOWED_DOCUMENT_TYPES,
];

export interface FileValidationResult {
	valid: boolean;
	error?: string;
	file?: File;
}

/**
 * Validate file size and type
 */
export function validateFile(
	file: File,
	maxSize: number = MAX_FILE_SIZE,
): FileValidationResult {
	// Check file size
	if (file.size > maxSize) {
		return {
			valid: false,
			error: `File terlalu besar. Maksimal ${formatFileSize(maxSize)}`,
		};
	}

	// All file types are allowed — only size is enforced

	return {
		valid: true,
		file,
	};
}

/**
 * Validate image specifically
 */
export function validateImage(file: File): FileValidationResult {
	if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
		return {
			valid: false,
			error: "File harus berupa gambar (JPEG, PNG, GIF, WebP, atau SVG)",
		};
	}

	return validateFile(file, MAX_IMAGE_SIZE);
}

/**
 * Validate document specifically
 */
export function validateDocument(file: File): FileValidationResult {
	if (!ALLOWED_DOCUMENT_TYPES.includes(file.type)) {
		return {
			valid: false,
			error: "File harus berupa dokumen (PDF, TXT, MD, CSV, JSON, atau XML)",
		};
	}

	return validateFile(file, MAX_DOCUMENT_SIZE);
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
	if (bytes === 0) {
		return "0 Bytes";
	}

	const k = 1024;
	const sizes = ["Bytes", "KB", "MB", "GB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}

/**
 * Check if file is an image
 */
export function isImage(file: File): boolean {
	return ALLOWED_IMAGE_TYPES.includes(file.type);
}

/**
 * Check if file is a document
 */
export function isDocument(file: File): boolean {
	return ALLOWED_DOCUMENT_TYPES.includes(file.type);
}
