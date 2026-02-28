
export class TagManager {

    constructor(tagsDisponiveis) {
        this.tagsDisponiveis = tagsDisponiveis;
    }

    // retorna a listagem de tags disponíveis
    getTagsDisponiveis() {
        return this.tagsDisponiveis;
    }

    // verifica se a tag digita realmente existe
    tagExistente(tagDigitada) {
        return this.tagsDisponiveis.find(
            tagExistente => tagExistente.toLowerCase() === tagDigitada.toLowerCase()
        );
    }

    // verifica se a tag selecionada já foi inserida na lista
    tagJaInserida(tagSelecionada, listaTags) {
        if (!listaTags) return undefined;

        return [...listaTags.querySelectorAll(".tag-nome")].find(
            tagExistente => tagExistente.textContent.toLowerCase() === tagSelecionada.toLowerCase()
        );
    }

    // Realiza todas as validações na tag
    tagValida(tagSelecionada, listaTags) {

        const tagExistente = this.tagExistente(tagSelecionada);
        const tagJaInserida = this.tagJaInserida(tagSelecionada, listaTags); 

        if (!tagExistente) {
            throw new Error("Tag não inserida", { cause: {
                titulo: "Tag inválida",
                mensagem: "A tag informada não corresponde a nenhuma tag disponível.\nEscolha outra tag e tente novamente."
            }})
        } else if (tagJaInserida) {
            throw new Error("Tag não inserida", { cause: {
                titulo: "Tag já inserida",
                mensagem: `A tag '${tagExistente}' já foi inserida.\nPor favor, verifique a listagem de tags inseridas e tente novamente.`
            }})
        }

        return tagExistente;
    }

    // cria novo item <li> da tag
    criarTag(tagDigitada, podeRemover=true) {

        const removerWrapper = 
        `<div class="remover-wrapper text-hint-parent">
            <svg class="icon-svg remover-icon" width="9" height="9" viewBox="0 0 9 9" fill="none"
                xmlns="http://www.w3.org/2000/svg">
                <path stroke="currentColor"
                    d="M8.73047 0.878906L5.24414 4.36523L8.73047 7.85156L7.85156 8.73047L4.36523 5.24414L0.878906 8.73047L0 7.85156L3.48633 4.36523L0 0.878906L0.878906 0L4.36523 3.48633L7.85156 0L8.73047 0.878906Z"
                    fill="currentColor" />
            </svg>
            <span class="text-hint tag-hint">Remover tag</span>
        </div>`;

        const tagNome = this.tagExistente(tagDigitada);
        const novaTag = document.createElement("li");
        novaTag.className = "tag";
        novaTag.innerHTML = `<span class="tag-nome"></span>${podeRemover ? removerWrapper : ""}`;
        const novaTagNome = novaTag.querySelector(".tag-nome");
        novaTagNome.textContent = tagNome;

        return novaTag;
    }
}