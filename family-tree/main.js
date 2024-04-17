(function() {
    var tree = Family_tree();

    document.getElementById("search_input").focus();

    document.getElementById("search_button").addEventListener("click", function(e) {
        tree.search();
    });

    document.getElementById("search_input").addEventListener("keyup", function(e) {
        e.preventDefault();
        if (e.keyCode === 13) {
            tree.search();
        }
    });

    document.getElementById("expand_all_button").addEventListener("click", function(e) {
        tree.expandAll();
    });

    document.getElementById("collapse_all_button").addEventListener("click", function(e) {
        tree.collapseAll();
    });

    tree.generate_tree();

})()
