
export function validarDados(formulario, mensagensErro, possuiImagem=false, imagemFormulario=null) {

    const campos = pegarDadosFormulario(formulario);
    
    formulario.addEventListener("input", (event) => {
        event.target.classList.remove("campo-erro");
    })
    
    if (!formulario.checkValidity() || (possuiImagem && !imagemFormulario.imgFile)) {

        let mensagem = "Há campos inválidos que precisam ser revisados:\n";

        const primeiroCampoErro = campos.find(campo => !campo.validity.valid);
        primeiroCampoErro ? primeiroCampoErro.focus() : null;

        campos.forEach(campo => {

            if (!campo.validity.valid) {
                campo.classList.add("campo-erro");
                mensagem += mensagensErro[campo.name];
            }
        })

        if (possuiImagem && !imagemFormulario.imgFile) {
            mensagem += mensagensErro["imagem"];
        }

        throw new Error("Campos inválidos", { cause: mensagem })

    }
}

export const pegarDadosFormulario = (formulario) => [...formulario.elements].filter(el => ["INPUT", "TEXTAREA"].includes(el.tagName));