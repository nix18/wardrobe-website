import test from 'node:test'
import assert from 'node:assert/strict'
import {cleanNotes,validateVersion,shouldUploadAsset,compareVersions} from './release-utils.mjs'
test('release notes retain changes but remove obsolete download blocks',()=>{
 assert.equal(cleanNotes('## 新增\r\n- 背景\r\n## 下载\r\nold link\r\n## 修复\r\n- 搜索'),'## 新增\n- 背景\n## 修复\n- 搜索')
})
test('versions cannot contain a path or command',()=>{
 assert.equal(validateVersion('1.0.14'),'1.0.14')
 for(const v of ['../x','1.0.14; echo secret','1.0','v1.0.14']) assert.throws(()=>validateVersion(v))
})

test('publishing the same APK is idempotent and a different APK needs explicit replacement',()=>{
 assert.equal(shouldUploadAsset(undefined,'abc',100),true)
 assert.equal(shouldUploadAsset({digest:'sha256:abc',size:100},'abc',100),false)
 assert.throws(()=>shouldUploadAsset({digest:'sha256:other',size:100},'abc',100))
 assert.equal(shouldUploadAsset({digest:'sha256:other',size:100},'abc',100,true),true)
})

test('revisions sort numerically without changing old release identities',()=>{
 assert.equal(validateVersion('1.0.15-r1'),'1.0.15-r1')
 for(const v of ['1.0.15-r0','1.0.15-r01','1.0.15-rx','1.0.15-r1/path'])assert.throws(()=>validateVersion(v))
 assert.deepEqual(['1.0.15-r2','1.0.15','1.0.16','1.0.15-r10','1.0.15-r1'].sort(compareVersions),['1.0.15','1.0.15-r1','1.0.15-r2','1.0.15-r10','1.0.16'])
})
