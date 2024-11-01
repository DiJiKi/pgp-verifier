async function generateRandomText() {
    const randomText = Array.from({ length: 32 }, () => 
        String.fromCharCode(Math.floor(Math.random() * (126 - 33 + 1)) + 33)).join('');
    document.getElementById("randomText").value = randomText;
}

function pasteSignature() {
    navigator.clipboard.readText().then(text => {
        document.getElementById('signature').value = text;
    });
}

function copySignature() { 
    const signature = document.getElementById('signatureResult');
    signature.select();
    document.execCommand('copy');
}

async function validateSignature() {
    const publicKeyFile = document.getElementById("publicKeyFile").files[0];
    const signatureText = document.getElementById("signature").value.trim();
    const randomText = document.getElementById("randomText").value;

    function loadPublicKeyContent(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => resolve(event.target.result);
            reader.onerror = (error) => reject(error);
            reader.readAsText(file);
        });
    }

    try {
        const publicKeyArmored = await loadPublicKeyContent(publicKeyFile);
        const publicKey = await openpgp.readKey({ armoredKey: publicKeyArmored });
        const message = await openpgp.createMessage({ text: randomText });
        const signature = await openpgp.readSignature({
            armoredSignature: signatureText
        });

        const verificationResult = await openpgp.verify({
            message,
            signature,
            verificationKeys: publicKey
        });

        const { verified, keyID } = verificationResult.signatures[0];
        await verified;

        const validationResult = document.getElementById("validationResult");
        validationResult.textContent = "The signature is valid and was created by key ID: " + keyID.toHex();
        validationResult.style.color = "green";

    } catch (error) {
        const validationResult = document.getElementById("validationResult");
        validationResult.textContent = "The signature could not be verified. It may be invalid or does not match the provided key.";
        validationResult.style.color = "red";
    }
}

/* 
async function validateSignature() {
    const publicKeyFile = document.getElementById("publicKeyFile").files[0];
    const signatureText = document.getElementById("signature").value.trim();
    const randomText = document.getElementById("randomText").value;

    function loadPublicKeyContent(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => resolve(event.target.result);
            reader.onerror = (error) => reject(error);
            reader.readAsText(file);
        });
    }

    try {
        const publicKeyArmored = await loadPublicKeyContent(publicKeyFile);
        const publicKey = await openpgp.readKey({ armoredKey: publicKeyArmored });
        const message = await openpgp.createMessage({ text: randomText });
        const signature = await openpgp.readSignature({
            armoredSignature: signatureText
        });

        const verificationResult = await openpgp.verify({
            message,
            signature,
            verificationKeys: publicKey
        });

        const { verified, keyID } = verificationResult.signatures[0];
        await verified;

				document.getElementById("validationResult").textContent = "The signature is valid and was created by key ID: " + keyID.toHex();
    } catch (error) {
				document.getElementById("validationResult").textContent = "The signature could not be verified. It may be invalid or does not match the provided key." ;
    }
}
*/

async function signText() {
    const privateKeyFile = document.getElementById("privateKeyFile").files[0];
    const passphrase = document.getElementById("privateKeyPassphrase").value;
    const challengeText = document.getElementById("challengeText").value;

    if (!privateKeyFile || !passphrase || !challengeText) {
        document.getElementById("signatureResult").value = "You must select a key, type the password and  paste the text.";
        return;
    }

    function loadPrivateKeyContent(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => resolve(event.target.result);
            reader.onerror = (error) => reject(error);
            reader.readAsText(file);
        });
    }

    try {
        const privateKeyArmored = await loadPrivateKeyContent(privateKeyFile);

        const privateKey = await openpgp.decryptKey({
            privateKey: await openpgp.readPrivateKey({ armoredKey: privateKeyArmored }),
            passphrase
        });

        const message = await openpgp.createMessage({ text: challengeText });

        const detachedSignature = await openpgp.sign({
            message,
            signingKeys: privateKey,
            detached: true
        });

				document.getElementById("signatureResult").value = detachedSignature ;
    } catch (error) {
        document.getElementById("signatureResult").value = "Signing error:" + error.message ;
    }
}

function extractSignature(signatureText) {
    const header = "-----BEGIN PGP SIGNATURE-----";
    const footer = "-----END PGP SIGNATURE-----";

    const trimmed = signatureText.trim();
    if (!trimmed.startsWith(header) || !trimmed.endsWith(footer)) {
        throw new Error("Formato de firma inválido.");
    }

    return trimmed.slice(
        trimmed.indexOf(header),
        trimmed.lastIndexOf(footer) + footer.length
    );
}

