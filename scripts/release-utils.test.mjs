import test from 'node:test'
import assert from 'node:assert/strict'
import {cleanNotes,validateVersion} from './release-utils.mjs'
test('release notes retain changes but remove obsolete download blocks',()=>{
 assert.equal(cleanNotes('## 新增\r\n- 背景\r\n## 下载\r\nold link\r\n## 修复\r\n- 搜索'),'## 新增\n- 背景\n## 修复\n- 搜索')
})
test('versions cannot contain a path or command',()=>{
 assert.equal(validateVersion('1.0.14'),'1.0.14')
 for(const v of ['../x','1.0.14; echo secret','1.0','v1.0.14']) assert.throws(()=>validateVersion(v))
})
