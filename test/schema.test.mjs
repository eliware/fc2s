import {identifier} from '../src/schema.mjs';
test('validates identifiers',()=>{expect(identifier('AIRPORT')).toBe('`AIRPORT`'); expect(()=>identifier('bad-name')).toThrow();});
