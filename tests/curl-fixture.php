<?php
/** Development fixture used only by integration.py's isolated test server.
 * PHP's cURL functions are disabled and replaced by this auto-prepend file.
 * No network traffic or billable model calls occur. Never upload this file.
 */
function curl_init($url=null){return (object)['url'=>$url,'options'=>[],'status'=>200,'errno'=>0];}
function curl_setopt_array($ch,$options){$ch->options=array_replace($ch->options,$options);return true;}
function curl_getinfo($ch,$option=0){return $option ? $ch->status : ['namelookup_time'=>0.001,'connect_time'=>0.01,'starttransfer_time'=>0.1,'total_time'=>0.2];}
function curl_errno($ch){return $ch->errno;}
function curl_close($ch){}
function curl_exec($ch){
    $options=$ch->options;
    if($ch->url==='https://api.github.com/repos/raldjr/sitefren/releases?per_page=10'){
        if(!empty($options[CURLOPT_POST])||isset($options[CURLOPT_POSTFIELDS]))throw new RuntimeException('Update check must not send project data');
        foreach($options[CURLOPT_HTTPHEADER] as $header)if(str_starts_with($header,'Authorization:'))throw new RuntimeException('Update check must not send credentials');
        $body=json_encode([['tag_name'=>'v0.1.9','draft'=>false,'prerelease'=>true]]);
        ($options[CURLOPT_WRITEFUNCTION])($ch,$body);
        return true;
    }
    if(!str_starts_with($ch->url,'https://api.concentrate.ai/')&&!str_starts_with($ch->url,'https://openrouter.ai/'))throw new RuntimeException('Unexpected provider destination');
    if(empty($options[CURLOPT_POST])){
        foreach($options[CURLOPT_HTTPHEADER] as $header)if(str_starts_with($header,'Authorization:'))throw new RuntimeException('A key was sent to a public catalog');
        $response=['data'=>[['id'=>'fixture-model','display_name'=>'Fixture Model'],['id'=>'fixture-zdr','display_name'=>'Restricted Fixture']],'has_more'=>false];
    }else{
        $payload=json_decode($options[CURLOPT_POSTFIELDS],true);
        $format = str_contains($ch->url,'openrouter.ai') ? ($payload['response_format']['json_schema'] ?? []) : ($payload['text']['format'] ?? []);
        if (($format['strict'] ?? false) !== true || ($format['schema']['required'] ?? []) !== ['message','files','delete','edits']) throw new RuntimeException('Missing structured edit schema');
        if($payload['model']==='fixture-fatal')trigger_error('Synthetic fatal; private-fixture-message',E_USER_ERROR);
        if($payload['model']==='fixture-exit')exit;
        if(($options[CURLOPT_TIMEOUT]??0)<30||($options[CURLOPT_TIMEOUT]??0)>300)throw new RuntimeException('Unexpected timeout');
        if(isset($payload['background'])||isset($payload['store'])||isset($payload['routing']))throw new RuntimeException('Unexpected retention or routing override');
        if($payload['model']==='fixture-timeout'){$ch->errno=CURLE_OPERATION_TIMEDOUT;return false;}
        if($payload['model']==='fixture-zdr'){$ch->status=422;$response=['error'=>['code'=>'zdr_route_unavailable','message'=>'ZDR cannot route this model; private-fixture-message']];}
        elseif($payload['model']==='fixture-unknown'){$ch->status=422;$response=['detail'=>[['loc'=>['body','model'],'msg'=>'Unknown model; private-fixture-message','input'=>'private-fixture-input']]];}
        else{
            // Exercise real timed progress callbacks, not only a prebuilt stream.
            usleep(5100000);
            if(isset($options[CURLOPT_XFERINFOFUNCTION]))($options[CURLOPT_XFERINFOFUNCTION])($ch,0,0,0,0);
            $text=json_encode(['message'=>'Created by the integration fixture.','files'=>[['path'=>'index.html','content'=>'<!doctype html><h1>Generated fixture site</h1>']],'delete'=>[]]);
            if($payload['model']==='fixture-target'){
                $input=$payload['input']??$payload['messages'][1]['content'];
                $context=json_decode(substr($input,strlen('CURRENT PROJECT JSON: ')),true);
                $selected=$context['selected_element']??[];
                if(($selected['path']??'')!=='index.html'||($selected['selector']??'')!=='body > main:nth-of-type(1) > article:nth-of-type(1)'||($selected['tag']??'')!=='article')throw new RuntimeException('Expected the selected first card');
                if(!str_contains($selected['html'],'Alpha card')||str_contains($selected['html'],'Beta card')||str_contains($selected['html'],'data-pocket-'))throw new RuntimeException('Incorrect selected source context');
                $content=str_replace('<article class="card" id="first">','<article class="card" id="first" style="background-color: red;">',$context['files']['index.html'],$changed);
                if($changed!==1)throw new RuntimeException('Expected one selected source card');
                $text=json_encode(['message'=>'Made the selected card red.','files'=>[],'delete'=>[],'edits'=>[['path'=>'index.html','find'=>'<article class="card" id="first">','replace'=>'<article class="card" id="first" style="background-color: red;">']]]);
            }
            if ($payload['model']==='fixture-invalid-json') $text='<html>private-model-output</html>';
            if ($payload['model']==='fixture-cutoff') $text='{"message":"Building","files":[{"path":"index.html","content":"unfinished';
            $response=str_contains($ch->url,'openrouter.ai')?['choices'=>[['finish_reason'=>'stop','message'=>['content'=>$text]]]]:['status'=>'completed','output'=>[['type'=>'message','content'=>[['type'=>'output_text','text'=>$text]]]]];
            if ($payload['model']==='fixture-cutoff') $response['usage']=['output_tokens'=>$payload['max_output_tokens']];
        }
    }
    $body=json_encode($response);
    return ($options[CURLOPT_WRITEFUNCTION])($ch,$body)===strlen($body);
}
