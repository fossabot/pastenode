require.config({ paths: { 'vs': '/app/node_modules/monaco-editor/min/vs' }});
	require(['vs/editor/editor.main'], function() {
		var editor = monaco.editor.create(document.getElementById('container'), {
			value: [
				pasteContent
			].join('\n'),
			language: pasteLanguage,
			readOnly: true
		});
	});