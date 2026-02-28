import { exibirModal } from "./modal.js";

export class InputManager {

    constructor({input, tagManager, listaTags, sugestoesTags, wrapper, aceitaSomenteTags=true, onEnter=null, resetBtn=null, onReset=null}) {
        
        // properties básicas da InputManager
        this.tagManager = tagManager;
        this.input = input;
        this.listaTags = listaTags;                 // lista das tags inseridas
        this.sugestoesTags = sugestoesTags;         // lista contendo sugestão de tags
        this.wrapper = wrapper;                     // conteiner do campo em si
        this.aceitaSomenteTags = aceitaSomenteTags; // boolean para limitar o campo a somente entrada de tags
        this.onEnter = onEnter;                     // função callback
        this.resetBtn = resetBtn; 
        this.onReset = onReset;
        this.itemSelecionado = -1;

        // setups
        this.setupSugestoes();
        this.setupListeners();
    }

    setupSugestoes() {
        this.tagManager.getTagsDisponiveis().forEach((tag, id) => {
            const novaTag = document.createElement("li");
            novaTag.classList.add("hidden", "sugestao-item");
            novaTag.setAttribute("tabindex", "-1");
            novaTag.setAttribute("data-id", id);
            novaTag.textContent = tag;     
            this.sugestoesTags.appendChild(novaTag);
        });
    }

    // retorna um array com cada item da lista <ul>
    getListaDeTags() {
        return [...this.listaTags.querySelectorAll(".tag-nome")];
    }

    // retorna um array com o nome de cada tag inserida na lista
    getListaDeTagsNomes() {
        return this.getListaDeTags().map(tag => tag.textContent);
    }

    // inclui uma nova tag na listagem
    incluirTag(novaTag) {
        this.listaTags.appendChild(novaTag);
        this.recolherLista();
        this.limparInput();
    }

    // seleciona a sugestão 
    selecionarSugestao(tagSelecionada) {
        this.input.value = tagSelecionada;
        this.recolherLista();
    }

    // filtra as sugestões conforme input do usuário e retorna a lista de tags
    filtrarSugestao(tagDigitada) {
        const tagsFiltradas = this.tagManager.getTagsDisponiveis()
            .map((tag, id) => ({id: id, nome: tag}))
            .filter(tag => tag.nome.toLowerCase().includes(tagDigitada))
            .slice(0, 5);
        tagsFiltradas.forEach(tag => this.sugestoesTags.querySelector(`[data-id="${tag.id}"]`).classList.remove("hidden"));

        return tagsFiltradas;                
    }

    // recolhe a lista de sugestões
    recolherLista() {
        if (!this.sugestoesTags.classList.contains("hidden")) {
            this.sugestoesTags.classList.add("hidden");
        }
        
        this.sugestoesTags.querySelectorAll(".sugestao-item").forEach(
            tag => {
                tag.classList.add("hidden");
                tag.classList.remove("item--em-foco");
            } 
        );

        this.input.classList.remove("sem-bordas");
        this.itemSelecionado = -1;
    }
    
    // destaca o item atualmente selecionado da lista de sugestão
    atualizarDestaque(listaSuspensa) {
        listaSuspensa.forEach((item, idx) => {
            item.classList.toggle("item--em-foco", idx === this.itemSelecionado);
        });
    }

    // dispara o evento ao pressionar o enter
    dispararEventoEnter(tagSelecionada=null, callback=null) {
        if (this.onEnter) {
            this.onEnter({
                inputText: tagSelecionada ? tagSelecionada : this.input.value,
                inputTags: this.getListaDeTagsNomes()
            });
        }
        if (callback) callback;
    }

    // dispara o evento ao clicar no botão de reset
    dispararEventoReset() {
        if (this.onReset) this.onReset();
    }

    // limpa o input de tags
    limparInput() {
        this.input.value = "";
    }

    // limpa a lista de tags
    limparLista() {
        this.listaTags.innerHTML = "";
    }

    // listeners de eventos
    setupListeners() {
        this.input.addEventListener("keydown", (event) => {    
            const textoDigitado = this.input.value.trim();
            const sugestoesVisiveis = this.sugestoesTags.querySelectorAll("li:not(.hidden)");  

            if (event.key === "Enter") {

                event.preventDefault();
                
                let tagSelecionada;
                if (this.itemSelecionado != -1) {
                    tagSelecionada = sugestoesVisiveis[this.itemSelecionado] ? sugestoesVisiveis[this.itemSelecionado].textContent : null;
                } else {
                    tagSelecionada = textoDigitado != "" ? textoDigitado : null;
                }
 
                if (!tagSelecionada && this.aceitaSomenteTags) {
                    return;
                }

                if (!this.aceitaSomenteTags && this.itemSelecionado != -1 || this.aceitaSomenteTags) {
                    try {
                        const tagValida = this.tagManager.tagValida(tagSelecionada, this.listaTags);
                        const novaTag = this.tagManager.criarTag(tagValida);
                        this.incluirTag(novaTag);
                        return;
                    }
                    catch (erro) {                    
                        exibirModal({
                            tipo: "aviso",
                            titulo: erro.cause.titulo,
                            mensagem: erro.cause.mensagem,
                        });
                    }
                }

                this.dispararEventoEnter(tagSelecionada, this.recolherLista);
                
            } else if (event.key === "ArrowDown") {

                event.preventDefault();
                this.itemSelecionado = (this.itemSelecionado + 1) % sugestoesVisiveis.length;
                this.atualizarDestaque(sugestoesVisiveis);

            } else if (event.key === "ArrowUp") {

                event.preventDefault();
                this.itemSelecionado = (this.itemSelecionado - 1 + sugestoesVisiveis.length) % sugestoesVisiveis.length;
                this.atualizarDestaque(sugestoesVisiveis);

            } else if (event.key == "Tab" && sugestoesVisiveis.length > 0) {

                event.preventDefault();

                if (this.itemSelecionado != -1) {
                    this.selecionarSugestao(sugestoesVisiveis[this.itemSelecionado].textContent);
                } else {
                    this.selecionarSugestao(sugestoesVisiveis[0].textContent);
                }
            }
        });

        let timer;
        this.input.addEventListener("input", () => {

            clearTimeout(timer);

            timer = setTimeout(() => {
                this.dispararEventoEnter();
            }, 300);

            const tagDigitada = this.input.value.toLowerCase().trim();

            this.recolherLista();

            if (tagDigitada === "") {
                return;
            }

            this.input.classList.add("sem-bordas");
            
            const tagsFiltradas = this.filtrarSugestao(tagDigitada);

            if (tagsFiltradas.length > 0) {
                this.sugestoesTags.classList.remove("hidden");
            } else {
                this.recolherLista();
            }
        });

        this.sugestoesTags.addEventListener("click", (event) => {
        
            const elementoClicado = event.target;
        
            if (elementoClicado.closest(".sugestao-item")) {
        
                const tagSelecionada = elementoClicado.closest(".sugestao-item");
                const tagSelecionadaNome = tagSelecionada.textContent;

                try {
                    const tagValida = this.tagManager.tagValida(tagSelecionadaNome, this.listaTags);
                    const novaTag = this.tagManager.criarTag(tagValida);
                    this.incluirTag(novaTag);
                    this.dispararEventoEnter();
                } catch (erro) {                    
                    exibirModal({
                        tipo: "aviso",
                        titulo: erro.cause.titulo,
                        mensagem: erro.cause.mensagem,
                        callback: () => this.input.focus()
                    });
                } finally {
                    this.input.focus();
                }
            }
        });

        this.listaTags.addEventListener("click", (event) => {

            const elementoClicado = event.target;

            if (elementoClicado.closest(".remover-wrapper")) {
                const tagParaRemover = elementoClicado.closest(".tag");
                this.listaTags.removeChild(tagParaRemover);
                this.dispararEventoEnter();
            }
        });

        this.wrapper.addEventListener("focusout", (event) => {

            const elementoComFoco = event.relatedTarget;   

            if (!this.wrapper.contains(elementoComFoco)) {
                this.recolherLista();
            }
        });

        if (this.resetBtn) {            
            this.resetBtn.addEventListener("click", (event) => {
                event.preventDefault();
                this.limparInput();
                this.limparLista();
                if (this.onReset) this.dispararEventoReset();
            });
        }
    }
};