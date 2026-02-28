import { exibirModal } from "../components/modal.js";

const urlBase = "http://localhost:8080";

export async function enviarProjeto({dadosProjeto, callback}) {
    try {
        const resposta = await fetch(`${urlBase}/projetos`, {
            method: "POST",
            body: dadosProjeto
        });       
        
        const resultado = await resposta.json();

        if (resposta.ok) {
            exibirModal({
                tipo: "sucesso",
                titulo: "Projeto criado",
                mensagem: `O projeto '${dadosProjeto.get("titulo")}' foi criado com sucesso!`,
                callback: callback
            });
        } else {        
            throw resultado; 
        }

    } catch (erro) {
        exibirModalErroGenerico(erro);
    }
}

export async function enviarComentario(dadosComentario, callback=null) {
    try {           
        const resposta = await fetch(`${urlBase}/comentarios`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json; charset=UTF-8'
            },
            body: JSON.stringify(Object.fromEntries(dadosComentario.entries()))
        });       
        
        const resultado = await resposta.json();

        if (resposta.ok) {
            exibirModal({
                tipo: "sucesso",
                titulo: "Comentário publicado",
                mensagem: `O comentário foi publicado com sucesso!`,
                callback: callback
            });
            
            return resultado;
        } else {        
            throw resultado; 
        }

    } catch (erro) {
        exibirModalErroGenerico(erro);
    }
}

export async function carregarListaTagsDisponiveis() {
    return await enviarRequisicao(`${urlBase}/tags`, "GET");
}

export async function carregarProjetos(filtros) {
    return await enviarRequisicao(`${urlBase}/projetos${filtros}`, "GET");
}

export async function buscarProjeto(projetoId) {
    return await enviarRequisicao(`${urlBase}/projetos/${projetoId}`, "GET");
}

async function enviarRequisicao(url, metodo) {
    try {
        const resposta = await fetch(url, {method: metodo});
        const resultado = await resposta.json();       
        if (resposta.ok) {
            return resultado;  
        } else {
            throw resultado;
        }
    } catch(erro) {
        exibirModalErroGenerico(erro);
        return null;
    }
}

function exibirModalErroGenerico(erro) {

    let mensagemErro;    

    if (erro instanceof TypeError) {
        mensagemErro = "Não foi possível conectar ao servidor.\nVerifique sua conexão ou se o servidor está online.";
    } else {        
        mensagemErro = erro.mensagem;
        if (Array.isArray(erro.erros)) {
            mensagemErro += "\n" + erro.erros.reduce((acc, e) => acc + "\n• " + e.motivo, "");
        }
    }    

    exibirModal({
        tipo: "erro",
        titulo: "A operação falhou",
        mensagem: mensagemErro || "Um erro inesperado impediu a conclusão do processo desejado." 
    });
}