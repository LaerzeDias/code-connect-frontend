const modal = document.querySelector("#modal-dinamico");
const btnPrincipal = document.querySelector("#modal-btn-principal");
const btnSecundario = document.querySelector("#modal-btn-secundario");
const lottiePlayer = document.querySelector("#modal-lottie");

export function exibirModal({ tipo, titulo, mensagem, textoBtnPrincipal = "Ok", callback = null }) {
    
    modal.className = `modal modal--${tipo} entrada-suave`;
    
    document.querySelector("#modal-titulo").textContent = titulo;
    document.querySelector("#modal-mensagem").textContent = mensagem;
    btnPrincipal.textContent = textoBtnPrincipal;

    const icones = { 
        erro: "../assets/error_animation.json", 
        aviso: "../assets/warning_animation.json", 
        confirmacao: "../assets/question_animation.json",
        sucesso: "../assets/success_animation.json"
    };

    lottiePlayer.load(icones[tipo]);

    btnSecundario.style.display = tipo === 'confirmacao' ? 'block' : 'none';

    btnPrincipal.onclick = () => {
        if (callback) callback();
        fecharModal();
    };

    btnSecundario.onclick = () => fecharModal();

    modal.showModal();
}

function fecharModal() {
    modal.classList.add("saida-suave");
    modal.addEventListener('animationend', () => {
        modal.close();
        modal.classList.remove("saida-suave");
    }, { once: true });
}