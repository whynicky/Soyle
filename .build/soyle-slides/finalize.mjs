import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const workspaceDir='/Users/whynicky/Desktop/Projects/Soyle';
const SKILL_DIR='/Users/whynicky/.codex/plugins/cache/openai-primary-runtime/presentations/26.1112.11217/skills/presentations';
const RUNTIME_PYTHON='/Users/whynicky/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3';
const FINAL_PPTX=path.join(workspaceDir,'output/soyle-project-overview-v5.pptx');
const stagingDir=path.join(workspaceDir,'.build/soyle-slides/finalizer');
await fs.mkdir(stagingDir,{recursive:true});
await fs.mkdir(path.dirname(FINAL_PPTX),{recursive:true});
const {finalizePresentation}=await import(pathToFileURL(path.join(SKILL_DIR,'container_tools/artifact_tool_utils.mjs')).href);
const result=await finalizePresentation({
 explicitTotalSlideCount:6,
 requiredNativeTableOwnerSlides:[],
 requiredNativeChartOwnerSlides:[],
 workspaceDir,
 candidatePath:path.join(workspaceDir,'.build/soyle-slides/draft.pptx'),
 finalPath:FINAL_PPTX,
 pythonExecutable:RUNTIME_PYTHON,
 integrityValidatorPath:path.join(SKILL_DIR,'container_tools/inspect_presentation_package_integrity.py'),
 layoutValidatorPath:path.join(SKILL_DIR,'container_tools/inspect_presentation_layout_geometry.py'),
 layoutArgs:['--expected-slide-size-emu','12192000,6858000','--validate-bullet-geometry','--validate-heading-fit'],
 fontPolicy:{basis:'design',families:['Arial']},
 verifyArtifactToolImport:true,
 receiptPath:path.join(stagingDir,'soyle-project-overview-v5.validation.json'),
});
console.log(JSON.stringify(result,null,2));
