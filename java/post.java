import java.net.HttpURLConnection;
import java.net.URL;
import java.io.OutputStreamWriter;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.BufferedReader;
import java.lang.StringBuilder;
import java.net.URLEncoder;
import java.io.UnsupportedEncodingException;

import org.json.simple.JSONObject;


public class post {
    public static String executePost(String targetURL, JSONObject json) {
        HttpURLConnection connection = null;

        try {
            //Create connection
            URL url = new URL(targetURL);
            connection = (HttpURLConnection) url.openConnection();
            connection.setRequestMethod("POST");
            connection.setRequestProperty("Content-Type", 
                "application/json");  

            connection.setUseCaches(false);
            connection.setDoOutput(true);
            connection.setDoInput(true);

            String str = json.toString();

            //Send request
            OutputStreamWriter wr = new OutputStreamWriter(connection.getOutputStream());
            wr.write(str);
            wr.flush();

            //Get Response  
            InputStream is = connection.getInputStream();
            BufferedReader rd = new BufferedReader(new InputStreamReader(is));
            StringBuilder response = new StringBuilder(); // or StringBuffer if Java version 5+
            String line;
            while ((line = rd.readLine()) != null) {
            response.append(line);
            response.append('\r');
            }
            rd.close();
            return response.toString();
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        } finally {
            if (connection != null) {
                connection.disconnect();
            }
        }
    }

    @SuppressWarnings("unchecked")
    public static void main(String[] args) {
        JSONObject json   = new JSONObject();
        json.put("playerId","xzhai2@stevens.edu");
        json.put("action", "startGame");
        String res = executePost("https://strikingly-hangman.herokuapp.com/game/on", json);
        System.out.println(res);
    }
}