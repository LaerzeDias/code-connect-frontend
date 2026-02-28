import { InputManager } from "../components/input.js";
import { carregarListaTagsDisponiveis } from "../api/api.js";
import { TagManager } from "../components/tags.js";
import { ProjetoManager } from "../components/projetos.js";

// lista de projetos
const listaProjetos = new ProjetoManager({
    filtros: document.querySelector(".feed__filtros-lista"),
    filtrosOnClick: () => ({
            inputText: inputPesquisa.input.value,
            inputTags: inputPesquisa.getListaDeTags().map(tag => tag.textContent).join(",")
        }),
    listaProjetos: document.querySelector(".projetos-lista"),
    contagemProjetos: document.querySelector(".feed__contagem-resultado"),
    carregarMais: document.querySelector(".carregar-mais"),
    maxItens: 6
});
await listaProjetos.buscarProjetos({}); // projetos carregados da API

// tags da barra de pesquisa do feed
const tagsDisponiveis = await carregarListaTagsDisponiveis(); // tags disponíveis carregadas da API

// input de pesquisa do feed
const inputPesquisa = new InputManager({
    tagManager: new TagManager(tagsDisponiveis),
    input: document.getElementById("feed__tags-input"),
    listaTags: document.getElementById("feed__tags-lista"),
    sugestoesTags: document.getElementById("feed__tags-sugestao"),
    wrapper: document.getElementById("feed__tags-wrapper"),
    aceitaSomenteTags: false,
    onEnter: (dados) => {
        listaProjetos.buscarProjetos({
            inputText: dados.inputText,
            inputTags: dados.inputTags,
            resetar: true
        });
    },
    resetBtn: document.getElementById("tags__reset-btn"),
    onReset: () => {
        listaProjetos.buscarProjetos({
            resetarFiltros: true,
            resetar: true
        });
    }
});