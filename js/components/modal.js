const modal = document.querySelector("#modal-dinamico");
const btnPrincipal = document.querySelector("#modal-btn-principal");
const btnSecundario = document.querySelector("#modal-btn-secundario");
const lottiePlayer = document.querySelector("#modal-lottie");
let tipoAtual;

const tipos = { 
        erro: {
            url: "../assets/error_animation.json",
            displayBtn: "block",
            displayBtnSecundario: "none",
            loop: false 
        }, 
        aviso: {
            url: "../assets/warning_animation.json",
            displayBtn: "block",
            displayBtnSecundario: "none",
            loop: false 
        },
        confirmacao: {
            url: "../assets/question_animation.json",
            displayBtn: "block",
            displayBtnSecundario: "block",
            loop: false 
        },
        sucesso: {
            url: "../assets/success_animation.json",
            displayBtn: "block",
            displayBtnSecundario: "none",
            loop: false 
        },
        loading: {
            url: "../assets/loading_animation.json",
            displayBtn: "none",
            displayBtnSecundario: "none",
            loop: true
        }
    };

export function exibirModal({ tipo, titulo, mensagem, exibirBtnSecundario, textoBtnPrincipal = "Ok", deveFechar = true, callback = null }) {

    tipoAtual = tipo;
    
    if (!modal.open) {
        modal.className = `modal modal--${tipo} entrada-suave`;
        modal.showModal();
    } else {
        modal.className = `modal modal--${tipo} fade-in`;
    }
    
    document.querySelector("#modal-titulo").textContent = titulo;
    document.querySelector("#modal-mensagem").textContent = mensagem;
    btnPrincipal.textContent = textoBtnPrincipal;    

    const dadosTipo = tipos[tipo];

    lottiePlayer.load(dadosTipo.url);
    lottiePlayer.addEventListener('ready', () => {
        dadosTipo.loop ? lottiePlayer.getLottie().setLoop(true) : null;
        lottiePlayer.play();
    }, { once: true });

    btnPrincipal.style.display = dadosTipo.displayBtn;
    btnPrincipal.onclick = () => {
        deveFechar ? fecharModal() : null;
        if (callback) callback();
    };

    btnSecundario.style.display = exibirBtnSecundario ? "block" : dadosTipo.displayBtnSecundario;
    btnSecundario.onclick = () => fecharModal();

    btnPrincipal.focus();
}

function fecharModal() {
    modal.classList.add("saida-suave");
    
    const cleanup = () => {
        modal.close();
        modal.classList.remove("saida-suave");
        modal.classList.remove("entrada-suave");
        lottiePlayer.play();
    };

    modal.addEventListener('animationend', cleanup, { once: true });
}

modal.addEventListener('cancel', (event) => {
    if (tipos[tipoAtual].displayBtn === "none") { 
        event.preventDefault();
    }
});