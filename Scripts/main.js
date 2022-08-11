
exports.activate = function() {
    // Do work when the extension is activated
}

exports.deactivate = function() {
    // Clean up state before the extension is deactivated
}

nova.commands.register("seeing-is-believing.annotateAllLines", (editor) => {
    run(editor, [])
});

nova.commands.register("seeing-is-believing.annotateMarkedLines", (editor) => {
    run(editor, ["--xmpfilter-style"])
});

nova.commands.register("seeing-is-believing.removeAnnotations", (editor) => {
    run(editor, ["--clean"])
});

function run(editor, commandArgs) {
    const documentSpan = new Range(0, editor.document.length);
    const unformattedText = editor.document.getTextInRange(documentSpan);

    const sibCommand = ["seeing_is_believing"]
    const args = [...sibCommand, ...commandArgs]
    const process = new Process("/usr/bin/env", {
      cwd: nova.workspace.path,
      args: args,
      stdio: "pipe",
    })
    const writer = process.stdin.getWriter();
    writer.ready.then(() => {
      writer.write(unformattedText);
      writer.close();
    });

    let out = ""
    let err = ""

    process.onStdout(function(line) {
        out += line
    })

    process.onStderr(function(line) {
        err += line
    })

    process.onDidExit(function(status) {
        if (err.length > 0) {
            console.error(err)
            return
        }

        if (out.length == 0) return

        editor.edit((edit) => edit.replace(documentSpan, out))
    })

    process.start()
}
