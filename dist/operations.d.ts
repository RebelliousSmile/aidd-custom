import { type ToolType } from './index.js';
export interface OverlayIndex {
    repo: string;
    branch: string;
    installedAt: string;
    files: string[];
    hashes?: Record<string, string>;
    tools?: ToolType[];
}
export declare function readOverlayIndex(rootDir: string, isGlobal?: boolean): OverlayIndex | null;
export declare function writeOverlayIndex(rootDir: string, index: OverlayIndex, isGlobal?: boolean): void;
export declare function deleteOverlayIndex(rootDir: string, isGlobal?: boolean): void;
export declare function installToolOverlay(tool: ToolType, projectRoot: string, overlayTempDir: string, hashes?: Record<string, string>, write?: boolean): string[];
export declare function installTemplates(projectRoot: string, overlayTempDir: string, hashes?: Record<string, string>, write?: boolean): string[];
export declare function installGlobalOverlay(globalRoot: string, overlayTempDir: string, hashes?: Record<string, string>, write?: boolean): string[];
export declare function cleanByIndex(rootDir: string, isGlobal?: boolean): number;
export declare function repairFromOverlay(rootDir: string, overlayTempDir: string, isGlobal?: boolean): string[];
export interface InstallStatus {
    notIndexed: boolean;
    repo: string | null;
    branch: string | null;
    installedAt: string | null;
    indexed: number;
    present: number;
    missing: string[];
}
export declare function checkInstallStatus(rootDir: string, isGlobal?: boolean): InstallStatus;
export interface OverlayComparison {
    indexedCount: number;
    overlayCount: number;
    inSync: boolean;
    missingFromDisk: string[];
    locallyModified: string[];
    overlayUpdated: string[];
    noHashBaseline: boolean;
}
export declare function compareWithOverlay(rootDir: string, overlayTempDir: string, isGlobal?: boolean): OverlayComparison;
//# sourceMappingURL=operations.d.ts.map