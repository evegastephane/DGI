package com.example.backend.util;

import com.example.backend.model.AvisImposition;
import com.example.backend.model.Contribuable;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.File;
import java.io.IOException;
import java.nio.file.*;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Component
public class AvisGeneratorUtil {

    @Value("${avis.template.path}")
    private String templatePath;

    @Value("${avis.scripts.path}")
    private String scriptsPath;

    @Value("${avis.output.dir}")
    private String outputDir;

    private static final DateTimeFormatter FR = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    public byte[] generatePdf(AvisImposition avis, Contribuable contrib) throws Exception {
        Path outDir = Path.of(outputDir);
        Files.createDirectories(outDir);

        String uid   = UUID.randomUUID().toString().substring(0, 8);
        Path docxTmp = outDir.resolve("avis_tmp_"      + uid + ".docx");
        Path docxFix = outDir.resolve("avis_repaired_" + uid + ".docx");

        try {
            fillTemplate(avis, contrib, docxTmp);
            Path docxFinal = repairDocx(docxTmp, docxFix, uid);
            convertToPdf(docxFinal, outDir);

            Path pdfOut = outDir.resolve(docxFinal.getFileName().toString().replace(".docx", ".pdf"));

            if (!Files.exists(pdfOut)) {
                StringBuilder ls = new StringBuilder("Fichiers dans " + outDir + " :\n");
                try (var s = Files.list(outDir)) { s.forEach(f -> ls.append("  ").append(f.getFileName()).append("\n")); }
                throw new RuntimeException("PDF introuvable apres conversion : " + pdfOut + "\n" + ls);
            }
            return Files.readAllBytes(pdfOut);

        } finally {
            silentDelete(docxTmp);
            silentDelete(docxFix);
            silentDelete(outDir.resolve("avis_repaired_" + uid + ".pdf"));
            Path unpackDir = outDir.resolve("unpacked_" + uid);
            if (Files.exists(unpackDir)) deleteDir(unpackDir);
        }
    }

    private void fillTemplate(AvisImposition avis, Contribuable contrib, Path output) throws Exception {
        String nom       = s(contrib != null ? contrib.getNomBeneficiaire() : "");
        String prenom    = s(contrib != null ? contrib.getPrenom()          : "");
        String nomFull   = (nom + " " + prenom).trim();
        String niu       = s(contrib != null ? contrib.getNiu()             : "");
        String structure = s(avis.getStructureFiscale() != null ? avis.getStructureFiscale()
                : (contrib != null ? contrib.getStructureFiscale() : "DGI"));
        String rib       = s(avis.getRibReceveur());
        String tel       = s(contrib != null ? contrib.getTelephone() : "");
        String annee     = avis.getAnneeFiscale()     != null ? avis.getAnneeFiscale().toString() : "-";
        String statut    = s(avis.getStatut());
        String reference = s(avis.getReference());
        String dateEmis  = avis.getDateNotification() != null
                ? avis.getDateNotification().format(FR) : LocalDate.now().format(FR);
        String montant   = avis.getMontant() != null ? String.format("%.2f", avis.getMontant()) : "0.00";
        String dateLim   = LocalDate.now().plusDays(30).format(FR);
        String urlAuth   = "https://dpr.harmony2.cm/authentication?doc=DPR_AVIS&amp;reference=" + reference;

        // Forward slashes : Python les accepte meme sur Windows
        String tplPath = templatePath.replace("\\", "/");
        String outPath = output.toString().replace("\\", "/");

        String script = "import zipfile, os\n"
                + "data = {\n"
                + "    'NOM':           '" + esc(nomFull)   + "',\n"
                + "    'NIU':           '" + esc(niu)       + "',\n"
                + "    'STRUCTURE':     '" + esc(structure) + "',\n"
                + "    'COMMUNE':       '',\n"
                + "    'RIB':           '" + esc(rib)       + "',\n"
                + "    'TEL':           '" + esc(tel)       + "',\n"
                + "    'ANNEE':         '" + annee          + "',\n"
                + "    'STATUT':        '" + statut         + "',\n"
                + "    'REFERENCE':     '" + reference      + "',\n"
                + "    'DATE_EMISSION': '" + dateEmis       + "',\n"
                + "    'NUM':           '1',\n"
                + "    'LIBELLE':       'Impots et taxes',\n"
                + "    'COMPTE':        '',\n"
                + "    'PRINCIPAL':     '" + montant        + "',\n"
                + "    'CAC':           '0.00',\n"
                + "    'PENALITES':     '0',\n"
                + "    'TOTAL':         '" + montant        + "',\n"
                + "    'TOT_PRINCIPAL': '" + montant        + "',\n"
                + "    'TOT_CAC':       '0.00',\n"
                + "    'TOT_PENALITES': '0',\n"
                + "    'TOT_TOTAL':     '" + montant        + "',\n"
                + "    'MONTANT':       '" + montant        + "',\n"
                + "    'DATE_LIMITE':   '" + dateLim        + "',\n"
                + "    'URL_AUTH':      '" + urlAuth        + "',\n"
                + "}\n"
                + "with zipfile.ZipFile('" + tplPath + "', 'r') as z:\n"
                + "    names = z.namelist()\n"
                + "    files = {n: z.read(n) for n in names}\n"
                + "for fname in names:\n"
                + "    if fname.endswith('.xml'):\n"
                + "        c = files[fname].decode('utf-8')\n"
                + "        for k, v in data.items():\n"
                + "            c = c.replace('{{' + k + '}}', v)\n"
                + "        files[fname] = c.encode('utf-8')\n"
                + "out = '" + outPath + "'\n"
                + "if os.path.exists(out): os.remove(out)\n"
                + "with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as z:\n"
                + "    for fname, content in files.items(): z.writestr(fname, content)\n"
                + "print('ok')\n";

        runPython(script);
    }

    private Path repairDocx(Path input, Path output, String uid) throws Exception {
        Path unpackPy = Path.of(scriptsPath, "unpack.py");
        Path packPy   = Path.of(scriptsPath, "pack.py");
        if (!Files.exists(unpackPy) || !Files.exists(packPy)) {
            System.out.println("[AvisGenerator] Scripts absents, reparation ignoree");
            return input;
        }
        Path unpackDir = input.getParent().resolve("unpacked_" + uid);
        int rc1 = runCmdRc(python(), unpackPy.toString(), input.toString(), unpackDir.toString());
        if (rc1 != 0) { System.out.println("[AvisGenerator] unpack.py echoue rc=" + rc1); return input; }
        int rc2 = runCmdRc(python(), packPy.toString(), unpackDir.toString(), output.toString(), "--original", input.toString());
        if (rc2 != 0) { System.out.println("[AvisGenerator] pack.py echoue rc=" + rc2); return input; }
        return Files.exists(output) ? output : input;
    }

    private void convertToPdf(Path docx, Path outDir) throws Exception {
        List<String> cmd;
        if (isWindows()) {
            // ProcessBuilder gère nativement les chemins avec espaces
            // quand l'exécutable est le premier élément de la liste.
            // Pas besoin de cmd /c ni de guillemets — c'est l'OS qui résout.
            cmd = List.of(
                    "C:\\Program Files\\LibreOffice\\program\\soffice.exe",
                    "--headless", "--convert-to", "pdf",
                    "--outdir", outDir.toString(),
                    docx.toString()
            );
        } else {
            cmd = List.of("libreoffice", "--headless", "--convert-to", "pdf",
                    "--outdir", outDir.toString(), docx.toString());
        }
        ProcessBuilder pb = new ProcessBuilder(cmd);
        if (!isWindows()) {
            pb.environment().put("SAL_USE_VCLPLUGIN", "svp");
            pb.environment().put("HOME", "/tmp");
        }
        pb.redirectErrorStream(true);
        Process p   = pb.start();
        String  out = new String(p.getInputStream().readAllBytes());
        int     rc  = p.waitFor();
        System.out.println("[AvisGenerator] LibreOffice rc=" + rc + " : " + out);
        if (rc != 0) throw new RuntimeException("LibreOffice echoue (rc=" + rc + ") : " + out);
    }

    private boolean isWindows() { return System.getProperty("os.name").toLowerCase().contains("win"); }
    private String python()     { return isWindows() ? "python" : "python3"; }

    private void runPython(String script) throws Exception {
        ProcessBuilder pb = new ProcessBuilder(python(), "-c", script);
        pb.redirectErrorStream(true);
        Process p   = pb.start();
        String  out = new String(p.getInputStream().readAllBytes());
        int     rc  = p.waitFor();
        System.out.println("[AvisGenerator] Python rc=" + rc + " : " + out);
        if (rc != 0) throw new RuntimeException("Python erreur (rc=" + rc + ") : " + out);
    }

    private int runCmdRc(String... cmd) throws Exception {
        ProcessBuilder pb = new ProcessBuilder(cmd);
        pb.redirectErrorStream(true);
        Process p  = pb.start();
        String out = new String(p.getInputStream().readAllBytes());
        int    rc  = p.waitFor();
        System.out.println("[AvisGenerator] " + Arrays.toString(cmd) + " rc=" + rc + " : " + out);
        return rc;
    }

    private void silentDelete(Path p) { try { Files.deleteIfExists(p); } catch (IOException ignored) {} }
    private void deleteDir(Path dir) throws IOException {
        Files.walk(dir).sorted(Comparator.reverseOrder()).map(Path::toFile).forEach(File::delete);
    }
    private String s(String v)   { return v != null ? v : ""; }
    private String esc(String v) { return s(v).replace("'", "\\'"); }
}