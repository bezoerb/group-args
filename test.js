import test from 'ava';
import fn from './';

test('use process args grouping', t => {
    let origArgv = process.argv;
    process.argv = ['node', 'mymodule.js', '-a', '-b', '--group-foo', '1', '--group-bar', '2'];
    let opts = fn('group');

    t.is(typeof opts.group, 'object');
    t.is(opts.group.foo, 1);
    t.is(opts.group.bar, 2);
    t.is(opts['group-foo'], undefined);
    t.is(opts['group-bar'], undefined);

    process.argv = origArgv;
});

test('default grouping', t => {
    const argv = ['-a', '-b', '--group-foo', '1', '--group-bar', '2'];
    let opts = fn('group', {argv: argv});

    t.is(typeof opts.group, 'object');
    t.is(opts.group.foo, 1);
    t.is(opts.group.bar, 2);
    t.is(opts['group-foo'], undefined);
    t.is(opts['group-bar'], undefined);
});

test('ignore', t => {
    const argv = ['-a', '-b', '--group-foo', '1', '--group-bar', '2'];
    let opts = fn('group', {argv: argv, ignore: ['group-foo']});

    t.is(typeof opts.group, 'object');
    t.is(opts.group.foo, undefined);
    t.is(opts.group.bar, 2);
    t.is(opts['group-foo'], 1);
    t.is(opts['group-bar'], undefined);
});

test('accept camelCase in non-strict mode', t => {
    const argv = ['-a', '-b', '--groupFoo', '1', '--groupBar', '2'];
    let opts = fn('group', {argv: argv, strict: false});

    t.is(typeof opts.group, 'object');
    t.truthy(opts.a);
    t.truthy(opts.b);
    t.is(opts.group.foo, 1);
    t.is(opts.group.bar, 2);
    t.is(opts.groupFoo, undefined);
    t.is(opts.groupBar, undefined);
});

test('rejects camelCase in strict mode', t => {
    const argv = ['-a', '-b', '--groupFoo', '1', '--groupBar', '2'];
    let opts = fn('group', {argv: argv, strict: true});

    t.is(opts.group, undefined);
    t.is(opts.groupFoo, 1);
    t.is(opts.groupBar, 2);
});

test('custom delimiter', t => {
    const argv = ['-a', '-b', '--group:foo', '1', '--group:bar', '2'];
    let opts = fn('group', {argv: argv, delimiter: ':'});

    t.truthy(opts.a);
    t.truthy(opts.b);
    t.is(opts.group.foo, 1);
    t.is(opts.group.bar, 2);
    t.is(opts.groupFoo, undefined);
    t.is(opts.groupBar, undefined);
});

test('short opts (alias)', t => {
    const argv = ['-a', '-b', '--group:foo', '1', '-g', '--group:bar', '2'];
    let opts = fn('group', {argv: argv, delimiter: ':'}, {alias: {g: 'group'}});

    t.truthy(opts.a);
    t.truthy(opts.b);
    t.is(opts.g.foo, 1);
    t.is(opts.g.bar, 2);
    t.is(opts.group.foo, 1);
    t.is(opts.group.bar, 2);
    t.is(opts['group:foo'], undefined);
    t.is(opts['group:bar'], undefined);
});

test('empty object', t => {
    const argv = ['-a', '-b', '--group'];
    let opts = fn('group', {argv: argv, delimiter: ':'}, {alias: {g: 'group'}});

    t.is(typeof opts.group, 'object');
});

test('argument order "--no-group" last', t => {
    const argv = ['--group-foo', '--no-group'];
    let opts = fn('group', {argv: argv});
    t.is(opts.group, false);
});

test('argument order "--no-group" first', t => {
    const argv = ['--no-group', '--group-foo'];
    let opts = fn('group', {argv: argv});
    t.not(opts.group, false);
    t.truthy(opts.group.foo);
});

test('default value', t => {
    const argv = ['--group', 'bar'];
    let opts = fn('group', {argv: argv});
    t.is(opts.group.default, 'bar');
});

test('default value configured', t => {
    const argv = ['--group', 'bar'];
    let opts = fn('group', {argv: argv, default: 'foo'});
    t.is(opts.group.foo, 'bar');
});

test('array identifier', t => {
    const argv = ['--group-foo', 'bar', '--module-name', 'group-args'];
    let opts = fn(['group','module'], {argv: argv});
    t.is(opts.group.foo, 'bar');
    t.is(opts.module.name, 'group-args');
});

test('array identifier with alias', t => {
    const argv = ['--group-foo', 'bar', '--module-name', 'group-args'];
    let opts = fn(['group','module'], {argv: argv}, {alias: {g:'group', m:'module'}});
    t.is(opts.group.foo, 'bar');
    t.is(opts.module.name, 'group-args');
    t.is(opts.g.foo, 'bar');
    t.is(opts.m.name, 'group-args');
});

test('object identifier', t => {
    const argv = ['--group-foo', 'bar', '--module-name', 'group-args'];
    let opts = fn({g:'group',m:'module'}, {argv: argv});
    t.is(opts.group.foo, 'bar');
    t.is(opts.module.name, 'group-args');
    t.is(opts.g.foo, 'bar');
    t.is(opts.m.name, 'group-args');
});

test('objext identifier with alias', t => {
    const argv = ['--group-foo', 'bar', '--module-name', 'group-args', '--test'];
    let opts = fn({g:'group',m:'module'}, {argv: argv}, {alias: {x:'group', t:'test'}});
    t.is(opts.group.foo, 'bar');
    t.is(opts.module.name, 'group-args');
    t.is(opts.g.foo, 'bar');
    t.is(opts.x.foo, 'bar');
    t.is(opts.m.name, 'group-args');
    t.truthy(opts.test);
    t.truthy(opts.t);
});

test('multiple calls', t => {
    const argv = ['--group-foo', 'bar', '--module-name', 'group-args', '--test'];
    let opts = fn({g:'group',m:'module'}, {argv: argv});
    let opts1 = fn({g:'group'}, {argv: argv});
    let opts2 = fn({m:'module'}, {argv: opts1});

    t.is(opts.group.foo, 'bar');
    t.is(opts.module.name, 'group-args');
    t.is(opts.g.foo, 'bar');
    t.is(opts.m.name, 'group-args');
    t.deepEqual(opts,opts2);
});
