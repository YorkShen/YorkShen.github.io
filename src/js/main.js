/**
 * Created by sy on 16/6/14.
 */
init();

function init() {
    document.addEventListener('DOMContentLoaded', function () {
        fetch_info();
        set_min_viewport();
    });
}

function fetch_info() {
    var json_xhr = new XMLHttpRequest();
    json_xhr.open("GET", "../data/resume.json", true);
    json_xhr.onload = function () {
        if (json_xhr.status == 200) {
            var result = JSON.parse(json_xhr.responseText);
            var mark_xhr = new XMLHttpRequest();
            mark_xhr.open("GET", "../res/mark.svg", true);
            mark_xhr.onload = load_skill(mark_xhr, result.skills);
            mark_xhr.send();
            load_svg(result.communication);
            document.getElementById("name").innerHTML = result.name;
            document.getElementById("title").innerHTML = result.title;
            load_content(result.biography);
        }
    };
    json_xhr.send();
}

function set_min_viewport() {
    window.onload = function () {
        var vp = document.getElementById("vp");
        if (screen.width < 320) {
            vp.setAttribute("content", "width=320, initial-scale=1");
        }
        else {
            vp.setAttribute("content", "width=device-width, initial-scale=1");
        }
    };
}

function load_svg(communication) {
    if (communication.length > 0) {
        var icon_xhr = new XMLHttpRequest();
        icon_xhr.open("GET", "../res/" + communication[0].icon);
        icon_xhr.onload = function () {
            if (icon_xhr.status == 200) {
                var communication_row = document.createElement("div");
                var communication_text = document.createElement("a");
                var communication_icon = icon_xhr.responseXML.documentElement;
                communication_text.innerHTML = communication[0].info;
                communication_text.className = "communication-text";
                if(communication[0].link){
                    communication_text.setAttribute("href",communication[0].link);
                }
                communication_icon.className.baseVal = "communication-icon";
                communication_row.className = "communication-row";
                communication_row.appendChild(communication_icon);
                communication_row.appendChild(communication_text);
                document.getElementById("communications").appendChild(communication_row);
                load_svg(communication.slice(1, communication.length));
            }
        };
        icon_xhr.send();
    }
}

function load_skill(mark_xhr, skills) {
    return function () {
        if (mark_xhr.status == 200) {
            for (var i = 0; i < skills.length; i++) {
                var skill = skills[i];
                var skill_row = document.createElement("div");
                var skill_name = document.createElement("div");
                var svg_document = mark_xhr.responseXML.cloneNode(true);
                var skill_score = svg_document.documentElement;
                skill_row.className = "skill-row";
                skill_name.className = "skill-name";
                skill_name.innerHTML = skill.name;
                skill_score.className.baseVal = "skill-score";
                svg_document.getElementById("score").setAttribute("width", skill.score);
                skill_row.appendChild(skill_name);
                skill_row.appendChild(skill_score);
                document.getElementById("skills").appendChild(skill_row);
            }
        }
    };
}


function load_content(biography) {
    var i, j;
    for (i = 0; i < biography.length; i++) {
        var section_div = document.createElement("div");
        var main_title = document.createElement("div");
        main_title.innerHTML = biography[i].title;
        main_title.className = "main_title";
        section_div.appendChild(main_title);
        for (j = 0; j < biography[i].content.length; j++) {
            create_item(biography[i].content[j],section_div);
        }
        document.getElementById("content").appendChild(section_div);
    }
}

function create_item(content,section_div) {
    var item = document.createElement("div");
    var sub_title = document.createElement("a");
    sub_title.innerHTML = content.sub_title;
    sub_title.classList.add("sub_title");
    if (content.link) {
        sub_title.setAttribute("href", content.link);
    }
    item.className = "item";
    item.appendChild(sub_title);
    var k;
    for (k = 0; k < content.items.length; k++) {
        create_sub_item(content.items[k], item);
    }
    section_div.appendChild(item);
}

function create_sub_item(content, item) {
    var sub_item=document.createElement("div");
    sub_item.className="sub_item";
    if (content.duration) {
        var duration = document.createElement("div");
        duration.className = "hint";
        duration.innerHTML = content.duration;
        sub_item.appendChild(duration);
    }
    if (content.description) {
        var description = document.createElement("div");
        description.className = "main_text";
        description.innerHTML = content.description;
        sub_item.appendChild(description);
    }
    item.appendChild(sub_item);
}