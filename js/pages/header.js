import { TagManager } from "../components/tags.js";

export function initHeaderTags(callback=null, tagsDisponiveis) {
    
    // tags da barra de pesquisa do header
    return new TagManager({
        input: document.getElementById("header__tags-input"),
        listaTags: document.getElementById("header__tags-lista"),
        sugestoesArray: tagsDisponiveis,
        sugestoesLista: document.getElementById("header__tags-sugestao"),
        wrapper: document.getElementById("header__tags-wrapper"),
        aceitaSomenteTags: false,
        onEnter: callback,
        resetBtn: document.getElementById("header__reset-btn")
    });
}